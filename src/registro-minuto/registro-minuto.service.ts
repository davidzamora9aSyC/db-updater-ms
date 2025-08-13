import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { RegistroMinuto } from './registro-minuto.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import {
  PasoProduccion,
  EstadoPasoOrden,
} from '../paso-produccion/paso-produccion.entity';
import {
  OrdenProduccion,
  EstadoOrdenProduccion,
} from '../orden-produccion/entity';
import { CreateRegistroMinutoDto } from './dto/create-registro-minuto.dto';
import { Mutex } from 'async-mutex';
import { DateTime } from 'luxon';
import { TipoEstadoSesion } from '../estado-sesion/estado-sesion.entity';

@Injectable()
export class RegistroMinutoService {
  private memoria: Map<string, { pedaleadas: number; piezasContadas: number }> =
    new Map();
  private mutex = new Mutex();

  constructor(
    @InjectRepository(RegistroMinuto)
    private readonly repo: Repository<RegistroMinuto>,
    @InjectRepository(SesionTrabajoPaso)
    private readonly stpRepo: Repository<SesionTrabajoPaso>,
    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    @InjectRepository(PasoProduccion)
    private readonly pasoRepo: Repository<PasoProduccion>,
  ) {}

  private async findSesionEnProduccionPorMaquina(
    maquinaId: string,
  ): Promise<SesionTrabajo | null> {
    const sesion = await this.sesionRepo
      .createQueryBuilder('s')
      .leftJoin('estado_sesion', 'e', 'e.sesionTrabajoId = s.id')
      .leftJoin('s.maquina', 'm')
      .where('m.id = :maquinaId', { maquinaId })
      .andWhere('e.estado = :estado', { estado: TipoEstadoSesion.PRODUCCION })
      .andWhere('e.fin IS NULL')
      .andWhere('s.fechaFin IS NULL')
      .getOne();
    return sesion || null;
  }

  async acumular(
    maquinaId: string,
    pasoId: string,
    tipo: 'pedal' | 'pieza',
    minutoInicio: string,
  ) {
    const sesion = await this.findSesionEnProduccionPorMaquina(maquinaId);

    if (!sesion) return;

    const pasoSesionTrabajo = await this.stpRepo.findOne({
      where: {
        sesionTrabajo: { id: sesion.id },
        pasoOrden: { id: pasoId },
      },
    });

    if (!pasoSesionTrabajo) return;

    await this.mutex.runExclusive(async () => {
      const fecha = DateTime.fromISO(minutoInicio, {
        zone: 'America/Bogota',
      }).toJSDate();
      const clave = `${sesion.id}_${pasoSesionTrabajo.id}_${fecha.toISOString()}`;
      const actual = this.memoria.get(clave) || {
        pedaleadas: 0,
        piezasContadas: 0,
      };

      if (tipo === 'pedal') actual.pedaleadas += 1;
      if (tipo === 'pieza') actual.piezasContadas += 1;

      this.memoria.set(clave, actual);
    });
  }

  async guardarYLimpiar() {
    await this.mutex.runExclusive(async () => {
      const registros: CreateRegistroMinutoDto[] = [];

      for (const [clave, data] of this.memoria.entries()) {
        const [sesionTrabajo, pasoSesionTrabajo, minutoInicio] = clave.split('_');
        registros.push({
          sesionTrabajo,
          pasoSesionTrabajo,
          minutoInicio: DateTime.fromISO(minutoInicio, {
            zone: 'America/Bogota',
          }).toISO() as string,
          ...data,
        });
      }

      for (const dto of registros) {
        const sesionTrabajoId = dto.sesionTrabajo;
        const pasoSesionTrabajoId = dto.pasoSesionTrabajo;
        const minutoInicio = DateTime.fromISO(dto.minutoInicio, {
          zone: 'America/Bogota',
        }).toJSDate();

        const existente = await this.repo.findOne({
          where: {
            sesionTrabajo: { id: sesionTrabajoId },
            pasoSesionTrabajo: { id: pasoSesionTrabajoId },
            minutoInicio,
          },
        });

        const nuevoRegistro = this.repo.create({
          sesionTrabajo: { id: sesionTrabajoId } as any,
          pasoSesionTrabajo: { id: pasoSesionTrabajoId } as any,
          minutoInicio,
          pedaleadas: (existente?.pedaleadas || 0) + dto.pedaleadas,
          piezasContadas: (existente?.piezasContadas || 0) + dto.piezasContadas,
        });

        await this.repo.save(nuevoRegistro);
        if (existente) await this.repo.remove(existente);

        const sesion = await this.sesionRepo.findOne({
          where: { id: sesionTrabajoId },
        });
        if (sesion) {
          sesion.cantidadProducida += dto.piezasContadas;
          sesion.cantidadPedaleos += dto.pedaleadas;
          await this.sesionRepo.save(sesion);
        }

        if (dto.pedaleadas > 0 || dto.piezasContadas > 0) {
          const pasoSesion = await this.stpRepo.findOne({
            where: { id: pasoSesionTrabajoId },
            relations: ['pasoOrden'],
          });

          if (pasoSesion) {
            pasoSesion.cantidadProducida += dto.piezasContadas;
            pasoSesion.cantidadPedaleos += dto.pedaleadas;
            await this.stpRepo.save(pasoSesion);

            const paso = await this.pasoRepo.findOne({
              where: { id: pasoSesion.pasoOrden.id },
              relations: ['orden'],
            });
            if (paso) {
              paso.cantidadProducida += dto.piezasContadas;
              paso.cantidadPedaleos += dto.pedaleadas;

              if (paso.cantidadPedaleos >= paso.cantidadRequerida) {
                if (!paso.fechaMetaAlcanzada)
                  paso.fechaMetaAlcanzada = DateTime.now()
                    .setZone('America/Bogota')
                    .toJSDate();

                const diff = DateTime.now()
                  .setZone('America/Bogota')
                  .diff(DateTime.fromJSDate(paso.fechaMetaAlcanzada), 'minutes')
                  .minutes;

                if (diff >= 5 && paso.estado !== EstadoPasoOrden.FINALIZADO) {
                  paso.estado = EstadoPasoOrden.FINALIZADO;

                  const pasos = await this.pasoRepo.find({
                    where: { orden: { id: paso.orden.id } },
                  });
                  const allFin = pasos.every(
                    (p) => p.estado === EstadoPasoOrden.FINALIZADO,
                  );
                  const anyPause = pasos.some(
                    (p) => p.estado === EstadoPasoOrden.PAUSADO,
                  );
                  const ordenRepo =
                    this.pasoRepo.manager.getRepository(OrdenProduccion);
                  const orden = await ordenRepo.findOne({
                    where: { id: paso.orden.id },
                  });
                  if (orden) {
                    if (allFin) {
                      orden.estado = EstadoOrdenProduccion.FINALIZADA;
                    } else if (anyPause) {
                      orden.estado = EstadoOrdenProduccion.PAUSADA;
                    }
                    await ordenRepo.save(orden);
                  }
                }
              }

              await this.pasoRepo.save(paso);
            }
          }
        }
      }

      this.memoria.clear();
      await this.finalizarPasosPendientes();
    });
  }

  private async finalizarPasosPendientes() {
    const pendientes = await this.pasoRepo.find({
      where: {
        fechaMetaAlcanzada: Not(IsNull()),
        estado: Not(EstadoPasoOrden.FINALIZADO),
      },
      relations: ['orden'],
    });

    for (const paso of pendientes) {
      const diff = DateTime.now()
        .setZone('America/Bogota')
        .diff(DateTime.fromJSDate(paso.fechaMetaAlcanzada as Date), 'minutes')
        .minutes;

      if (diff >= 5) {
        paso.estado = EstadoPasoOrden.FINALIZADO;
        await this.pasoRepo.save(paso);

        const pasos = await this.pasoRepo.find({
          where: { orden: { id: paso.orden.id } },
        });
        const allFin = pasos.every(
          (p) => p.estado === EstadoPasoOrden.FINALIZADO,
        );
        const anyPause = pasos.some(
          (p) => p.estado === EstadoPasoOrden.PAUSADO,
        );
        const ordenRepo = this.pasoRepo.manager.getRepository(OrdenProduccion);
        const orden = await ordenRepo.findOne({ where: { id: paso.orden.id } });
        if (orden) {
          if (allFin) {
            orden.estado = EstadoOrdenProduccion.FINALIZADA;
          } else if (anyPause) {
            orden.estado = EstadoOrdenProduccion.PAUSADA;
          }
          await ordenRepo.save(orden);
        }
      }
    }
  }
  @Cron('* * * * *')
  handleCron() {
    this.guardarYLimpiar();
  }

  async obtenerPorSesion(sesionTrabajoId: string): Promise<RegistroMinuto[]> {
    const registros = await this.repo.find({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
      order: { minutoInicio: 'ASC' },
    });
    return registros;
  }
}
