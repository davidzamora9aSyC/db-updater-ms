import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, IsNull } from 'typeorm';
import { DateTime } from 'luxon';
import { EstadoTrabajador } from './estado-trabajador.entity';
import { CreateEstadoTrabajadorDto } from './dto/create-estado-trabajador.dto';
import { UpdateEstadoTrabajadorDto } from './dto/update-estado-trabajador.dto';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';
import { TipoEstadoSesion } from '../estado-sesion/estado-sesion.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';
import { PasoProduccionService } from 'paso-produccion/paso-produccion.service';
import { PausaPasoSesionService } from '../pausa-paso-sesion/pausa-paso-sesion.service';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';

const ZONA_BOGOTA = 'America/Bogota';
const ORIGEN_DESCANSO_AUTOMATICO = 'automatico:descanso-programado';
const DESCANSOS_PROGRAMADOS = [
  { nombre: 'desayuno', inicio: { hora: 9, minuto: 50 }, fin: { hora: 10, minuto: 0 } },
  { nombre: 'almuerzo', inicio: { hora: 13, minuto: 0 }, fin: { hora: 13, minuto: 30 } },
];

@Injectable()
export class EstadoTrabajadorService {
  constructor(
    @InjectRepository(EstadoTrabajador)
    private readonly repo: Repository<EstadoTrabajador>,
    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    @InjectRepository(EstadoMaquina)
    private readonly estadoMaquinaRepo: Repository<EstadoMaquina>,
    private readonly estadoSesionService: EstadoSesionService,
    private readonly pasoProduccionService: PasoProduccionService,
    private readonly pausaPasoSesionService: PausaPasoSesionService,
  ) {}

  async create(dto: CreateEstadoTrabajadorDto) {
    const inicio = new Date();
    const fin = null;

    const abiertos = await this.repo.find({
      where: { trabajador: { id: dto.trabajador }, fin: IsNull() },
    });
    for (const a of abiertos) {
      a.fin = inicio;
      await this.repo.save(a);
    }

    const entity = this.repo.create({
      trabajador: { id: dto.trabajador } as any,
      descanso: dto.descanso,
      origen: 'manual',
      inicio,
      fin: null,
    });
    const nuevo = await this.repo.save(entity);

    if (dto.descanso) {
      await this.pausarPasoSesion(dto.trabajador, inicio);
    }

    await this.actualizarSesionOtro(dto.trabajador, inicio);

    return nuevo;
  }

  @Cron('* * * * *')
  async aplicarDescansosProgramados() {
    const ahora = DateTime.now().setZone(ZONA_BOGOTA);
    if (ahora.weekday < 1 || ahora.weekday > 5) {
      await this.finalizarDescansosAutomaticos(ahora.toJSDate());
      return;
    }

    const descansoActivo = DESCANSOS_PROGRAMADOS.find((descanso) =>
      this.estaDentroDeRango(ahora, descanso.inicio, descanso.fin),
    );

    if (!descansoActivo) {
      await this.finalizarDescansosAutomaticos(ahora.toJSDate());
      return;
    }

    await this.iniciarDescansoAutomatico(
      `${ORIGEN_DESCANSO_AUTOMATICO}:${descansoActivo.nombre}`,
      ahora.toJSDate(),
    );
  }

  private estaDentroDeRango(
    ahora: DateTime,
    inicio: { hora: number; minuto: number },
    fin: { hora: number; minuto: number },
  ) {
    const minutosActuales = ahora.hour * 60 + ahora.minute;
    const minutosInicio = inicio.hora * 60 + inicio.minuto;
    const minutosFin = fin.hora * 60 + fin.minuto;
    return minutosActuales >= minutosInicio && minutosActuales < minutosFin;
  }

  private async iniciarDescansoAutomatico(origen: string, inicio: Date) {
    const sesiones = await this.sesionRepo.find({
      where: { fechaFin: IsNull() },
      relations: ['trabajador'],
    });
    const trabajadorIds = Array.from(
      new Set(
        sesiones
          .map((sesion) => sesion.trabajador?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    if (trabajadorIds.length === 0) return;

    for (const trabajadorId of trabajadorIds) {
      const descansoAbierto = await this.repo.findOne({
        where: {
          trabajador: { id: trabajadorId },
          fin: IsNull(),
          descanso: true,
        },
      });
      if (descansoAbierto) continue;

      const abiertos = await this.repo.find({
        where: { trabajador: { id: trabajadorId }, fin: IsNull() },
      });
      for (const abierto of abiertos) {
        abierto.fin = inicio;
        await this.repo.save(abierto);
      }

      const estado = this.repo.create({
        trabajador: { id: trabajadorId } as any,
        descanso: true,
        origen,
        inicio,
        fin: null,
      });
      await this.repo.save(estado);
      await this.pausarPasoSesion(trabajadorId, inicio);
      await this.actualizarSesionOtro(trabajadorId, inicio);
    }
  }

  private async finalizarDescansosAutomaticos(fin: Date) {
    const activos = await this.repo.find({
      where: {
        descanso: true,
        fin: IsNull(),
        origen: In(DESCANSOS_PROGRAMADOS.map((d) => `${ORIGEN_DESCANSO_AUTOMATICO}:${d.nombre}`)),
      },
      relations: ['trabajador'],
    });

    for (const activo of activos) {
      activo.fin = fin;
      await this.repo.save(activo);
      await this.restaurarPausasPasoSesion(activo.trabajador.id, fin);
      await this.restaurarSesionProduccion(activo.trabajador.id, fin);
    }
  }

  findAll() {
    return this.repo.find({ relations: ['trabajador'] });
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    return estado;
  }

  async update(id: string, dto: UpdateEstadoTrabajadorDto) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    if (dto.fin)
      estado.fin = DateTime.fromJSDate(dto.fin, {
        zone: 'America/Bogota',
      }).toJSDate();
    const actualizado = await this.repo.save(estado);

    if (dto.fin) {
      await this.restaurarPausasPasoSesion(estado.trabajador.id, estado.fin);
      await this.restaurarSesionProduccion(
        estado.trabajador.id,
        estado.fin,
      );
    }

    return actualizado;
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }

  findByTrabajador(trabajadorId: string, inicioStr: string, finStr: string) {
    const inicio = DateTime.fromISO(inicioStr, {
      zone: 'America/Bogota',
    }).toJSDate();
    const fin = DateTime.fromISO(finStr, {
      zone: 'America/Bogota',
    }).toJSDate();
    return this.repo
      .createQueryBuilder('estado')
      .leftJoinAndSelect('estado.trabajador', 'trabajador')
      .where('trabajador.id = :trabajadorId', { trabajadorId })
      .andWhere('estado.inicio <= :fin')
      .andWhere('(estado.fin IS NULL OR estado.fin >= :inicio)')
      .orderBy('estado.inicio', 'DESC')
      .setParameters({ inicio, fin })
      .getMany();
  }

  private async pausarPasoSesion(trabajadorId: string, fecha: Date) {
    const sesiones = await this.sesionRepo.find({
      where: { trabajador: { id: trabajadorId }, fechaFin: IsNull() },
    });
    const stpRepo = this.repo.manager.getRepository(SesionTrabajoPaso);

    for (const sesion of sesiones) {
      const pasos = await stpRepo.find({
        where: { sesionTrabajo: { id: sesion.id } },
      });
      for (const paso of pasos) {
        const pausaActiva = await this.pausaPasoSesionService.findActive(paso.id);
        if (!pausaActiva) {

          await this.pausaPasoSesionService.create(
            paso.id,
            fecha,
            undefined,
            trabajadorId,
          );

          break;
        }
      }
    }
  }

  private async actualizarSesionOtro(trabajadorId: string, fecha: Date) {
    const sesiones = await this.sesionRepo.find({
      where: { trabajador: { id: trabajadorId }, fechaFin: IsNull() },
    });
    for (const sesion of sesiones) {
      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const actual = estados.find((e) => e.fin === null);
      if (actual?.estado !== TipoEstadoSesion.OTRO) {
        if (actual) {
          await this.estadoSesionService.update(actual.id, { fin: fecha });
        }
        await this.estadoSesionService.create({
          sesionTrabajo: sesion.id,
          estado: TipoEstadoSesion.OTRO,
          inicio: fecha,
        });
      }
      await this.pasoProduccionService.actualizarEstadoPorSesion(sesion.id);
    }
  }

  private async restaurarSesionProduccion(
    trabajadorId: string,
    fin: Date | null,
  ) {
    const sesiones = await this.sesionRepo.find({
      where: { trabajador: { id: trabajadorId }, fechaFin: IsNull() },
      relations: ['maquina'],
    });
    if (!fin || sesiones.length === 0) return;
    const trabajadorActivo = await this.repo.findOne({
      where: { trabajador: { id: trabajadorId }, fin: IsNull() },
    });
    if (trabajadorActivo) return;
    for (const sesion of sesiones) {
      const maquinaActiva = await this.estadoMaquinaRepo.findOne({
        where: { maquina: { id: sesion.maquina.id }, fin: IsNull() },
      });
      if (maquinaActiva) continue;
      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const actual = estados.find((e) => e.fin === null);
      if (!actual || actual.estado !== TipoEstadoSesion.OTRO) continue;
      await this.estadoSesionService.update(actual.id, { fin });
      await this.estadoSesionService.create({
        sesionTrabajo: sesion.id,
        estado: TipoEstadoSesion.PRODUCCION,
        inicio: fin,
      });
      await this.pasoProduccionService.actualizarEstadoPorSesion(sesion.id);
    }
  }

  private async restaurarPausasPasoSesion(
    trabajadorId: string,
    fin: Date | null,
  ) {
    const sesiones = await this.sesionRepo.find({
      where: { trabajador: { id: trabajadorId }, fechaFin: IsNull() },
    });
    if (!fin || sesiones.length === 0) return;
    const stpRepo = this.repo.manager.getRepository(SesionTrabajoPaso);
    for (const sesion of sesiones) {
      const pasos = await stpRepo.find({
        where: { sesionTrabajo: { id: sesion.id } },
      });
      for (const paso of pasos) {
        await this.pausaPasoSesionService.closeActive(
          paso.id,
          fin,
          undefined,
          trabajadorId,
        );
      }
    }
  }

  async finalizarDescanso(trabajadorId: string) {
    const activo = await this.repo.findOne({
      where: { trabajador: { id: trabajadorId }, fin: IsNull(), descanso: true },
    });
    if (!activo) throw new NotFoundException('No hay descanso activo');

    const fin = new Date();
    activo.fin = fin;
    const actualizado = await this.repo.save(activo);

    await this.restaurarPausasPasoSesion(trabajadorId, fin);
    await this.restaurarSesionProduccion(trabajadorId, fin);

    return actualizado;
  }
}
