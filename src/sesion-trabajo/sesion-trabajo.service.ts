import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SesionTrabajo } from './sesion-trabajo.entity';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';
import { RegistroMinutoService } from '../registro-minuto/registro-minuto.service';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { ProduccionDiariaService } from '../produccion-diaria/produccion-diaria.service';
import { DateTime } from 'luxon';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';
import {
  EstadoSesion,
  TipoEstadoSesion,
} from '../estado-sesion/estado-sesion.entity';

@Injectable()
export class SesionTrabajoService {
  constructor(
    @InjectRepository(SesionTrabajo)
    private readonly repo: Repository<SesionTrabajo>,
    private readonly registroMinutoService: RegistroMinutoService,
    private readonly estadoSesionService: EstadoSesionService,
    private readonly configService: ConfiguracionService,
    private readonly produccionDiariaService: ProduccionDiariaService,
    @InjectRepository(EstadoSesion)
    private readonly estadoSesionRepo: Repository<EstadoSesion>,
    @InjectRepository(EstadoTrabajador)
    private readonly estadoTrabajadorRepo: Repository<EstadoTrabajador>,
    @InjectRepository(EstadoMaquina)
    private readonly estadoMaquinaRepo: Repository<EstadoMaquina>,
  ) {}

  private toBogotaDate(input?: string | Date | null) {
    if (!input) return DateTime.now().setZone('America/Bogota').toJSDate();
    if (typeof input === 'string')
      return DateTime.fromISO(input, { zone: 'America/Bogota' }).toJSDate();
    return DateTime.fromJSDate(input, { zone: 'America/Bogota' }).toJSDate();
  }
  private toBogotaISO(d?: Date | null) {
    if (!d) return null;
    return DateTime.fromJSDate(d, { zone: 'America/Bogota' }).toISO();
  }
  private formatSesionForResponse<
    T extends { fechaInicio?: Date | null; fechaFin?: Date | null },
  >(s: T): T & { fechaInicio?: string | null; fechaFin?: string | null } {
    return {
      ...s,
      fechaInicio: this.toBogotaISO(s.fechaInicio as any),
      fechaFin: this.toBogotaISO(s.fechaFin as any),
    };
  }

  private async mapSesionConEstado(sesion: SesionTrabajo) {
    const estadoSesionActivo = await this.estadoSesionRepo.findOne({
      where: { sesionTrabajo: { id: sesion.id }, fin: IsNull() },
    });

    if (estadoSesionActivo?.estado === TipoEstadoSesion.OTRO) {
      const estadoTrabajadorActivo = await this.estadoTrabajadorRepo.findOne({
        where: { trabajador: { id: sesion.trabajador.id }, fin: IsNull() },
      });
      if (estadoTrabajadorActivo?.descanso === true) {
        return { ...sesion, estadoSesion: 'descanso' };
      }

      const estadoMaquinaActivo = await this.estadoMaquinaRepo.findOne({
        where: { maquina: { id: sesion.maquina.id }, fin: IsNull() },
      });
      if (estadoMaquinaActivo?.mantenimiento === true) {
        return { ...sesion, estadoSesion: 'mantenimiento' };
      }
    }

    return { ...sesion, estadoSesion: estadoSesionActivo?.estado };
  }

  async create(dto: CreateSesionTrabajoDto) {
    const sesionMaquinaActiva = await this.repo.findOne({
      where: {
        maquina: { id: dto.maquina },
        fechaFin: IsNull(),
      },
    });
    if (sesionMaquinaActiva) {
      throw new BadRequestException('La máquina ya tiene una sesión activa');
    }
    const sesion = this.repo.create({
      trabajador: { id: dto.trabajador } as any,
      maquina: { id: dto.maquina } as any,
      fechaInicio: this.toBogotaDate((dto as any).fechaInicio),
      fechaFin: undefined,
      cantidadProducida: 0,
      cantidadPedaleos: 0,
    });
    const saved = await this.repo.save(sesion);
    return this.formatSesionForResponse(saved);
  }

  async findAll() {
    const sesiones = await this.repo.find({
      relations: ['trabajador', 'maquina'],
    });
    return sesiones.map((s) => this.formatSesionForResponse(s));
  }

  async findOne(id: string) {
    const sesion = await this.repo.findOne({
      where: { id },
      relations: ['trabajador', 'maquina'],
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    return this.formatSesionForResponse(sesion);
  }

  async findByMaquina(maquinaId: string) {
    const sesion = await this.repo.findOne({
      where: { maquina: { id: maquinaId }, fechaFin: IsNull() },
      relations: ['trabajador', 'maquina'],
    });
    if (!sesion)
      throw new NotFoundException('Sesión no encontrada para la máquina');
    return this.formatSesionForResponse(sesion);
  }

  async findEnProduccionPorMaquina(maquinaId: string) {
    const estado = await this.estadoSesionRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.sesionTrabajo', 's')
      .leftJoinAndSelect('s.trabajador', 't')
      .leftJoinAndSelect('s.maquina', 'm')
      .where('m.id = :maquinaId', { maquinaId })
      .andWhere('e.estado = :estado', { estado: TipoEstadoSesion.PRODUCCION })
      .andWhere('e.fin IS NULL')
      .andWhere('s.fechaFin IS NULL')
      .getOne();

    if (!estado)
      throw new NotFoundException(
        'Sesión en producción no encontrada para la máquina',
      );
    return this.formatSesionForResponse(estado.sesionTrabajo);
  }

  async update(id: string, dto: UpdateSesionTrabajoDto) {
    const sesion = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    const estabaAbierta = !sesion.fechaFin;
    if (dto.fechaFin === true) {
      const descansoActivo = await this.estadoTrabajadorRepo.findOne({
        where: {
          trabajador: { id: sesion.trabajador.id },
          fin: IsNull(),
          descanso: true,
        },
      });
      if (descansoActivo)
        throw new BadRequestException(
          'No se puede finalizar la sesión mientras el trabajador está en descanso. Termina el descanso antes de finalizar.',
        );
      sesion.fechaFin = DateTime.now().setZone('America/Bogota').toJSDate();
    }

    if (dto.cantidadProducida !== undefined)
      sesion.cantidadProducida = dto.cantidadProducida;
    if (dto.cantidadPedaleos !== undefined)
      sesion.cantidadPedaleos = dto.cantidadPedaleos;

    if (
      (dto as any).fechaInicio &&
      typeof (dto as any).fechaInicio === 'string'
    ) {
      sesion.fechaInicio = this.toBogotaDate(
        (dto as any).fechaInicio as string,
      );
    }
    if (typeof (dto as any).fechaFin === 'string') {
      sesion.fechaFin = this.toBogotaDate((dto as any).fechaFin as string);
    }

    const saved = await this.repo.save(sesion);
    if (estabaAbierta && saved.fechaFin) {
      await this.produccionDiariaService.actualizarProduccionPorSesionCerrada(
        saved.id,
      );
    }
    return this.formatSesionForResponse(saved);
  }

  async finalizar(id: string) {
    const sesion = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    const estabaAbierta = !sesion.fechaFin;
    const descansoActivo = await this.estadoTrabajadorRepo.findOne({
      where: {
        trabajador: { id: sesion.trabajador.id },
        fin: IsNull(),
        descanso: true,
      },
    });
    if (descansoActivo)
      throw new BadRequestException(
        'No se puede finalizar la sesión mientras el trabajador está en descanso. Termina el descanso antes de finalizar.',
      );
    sesion.fechaFin = DateTime.now().setZone('America/Bogota').toJSDate();
    await this.repo.save(sesion);
    if (estabaAbierta) {
      await this.produccionDiariaService.actualizarProduccionPorSesionCerrada(
        sesion.id,
      );
    }
    return this.formatSesionForResponse(sesion);
  }

  async remove(id: string) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    await this.repo.remove(sesion);
    return { deleted: true };
  }

  async findActuales() {
    const sesiones = await this.repo.find({
      where: { fechaFin: IsNull() },
      relations: ['trabajador', 'maquina'],
    });

    const minutosInactividadParaNPT =
      await this.configService.getMinInactividad();
    const resultado: any[] = [];

    for (const sesion of sesiones) {
      const sesionConEstado = await this.mapSesionConEstado(sesion);

      const registros = await this.registroMinutoService.obtenerPorSesion(
        sesion.id,
      );
      const totalPiezas = registros.reduce((a, b) => a + b.piezasContadas, 0);
      const totalPedales = registros.reduce((a, b) => a + b.pedaleadas, 0);

      const defectos = totalPedales - totalPiezas;
      const nptMinRegistro = registros.filter(
        (r) => r.pedaleadas === 0 && r.piezasContadas === 0,
      ).length;
      let nptPorInactividad = 0;
      const ordenados = [...registros].sort(
        (a, b) =>
          DateTime.fromJSDate(a.minutoInicio, {
            zone: 'America/Bogota',
          }).toMillis() -
          DateTime.fromJSDate(b.minutoInicio, {
            zone: 'America/Bogota',
          }).toMillis(),
      );
      for (let i = 1; i < ordenados.length; i++) {
        const diff = DateTime.fromJSDate(ordenados[i].minutoInicio, {
          zone: 'America/Bogota',
        }).diff(
          DateTime.fromJSDate(ordenados[i - 1].minutoInicio, {
            zone: 'America/Bogota',
          }),
          'minutes',
        ).minutes;
        if (diff > minutosInactividadParaNPT)
          nptPorInactividad += diff - minutosInactividadParaNPT;
      }
      const registrosOrdenados = [...ordenados];
      const tieneRegistros = registrosOrdenados.length > 0;
      const start = tieneRegistros
        ? Math.max(
            DateTime.fromJSDate(sesion.fechaInicio, {
              zone: 'America/Bogota',
            }).toMillis(),
            DateTime.fromJSDate(registrosOrdenados[0].minutoInicio, {
              zone: 'America/Bogota',
            }).toMillis(),
          )
        : DateTime.fromJSDate(sesion.fechaInicio, {
            zone: 'America/Bogota',
          }).toMillis();
      const lastSlot = tieneRegistros
        ? DateTime.fromJSDate(
            registrosOrdenados[registrosOrdenados.length - 1].minutoInicio,
            { zone: 'America/Bogota' },
          )
            .plus({ minutes: 1 })
            .toMillis()
        : 0;
      const end = sesion.fechaFin
        ? DateTime.fromJSDate(sesion.fechaFin, {
            zone: 'America/Bogota',
          }).toMillis()
        : DateTime.now().setZone('America/Bogota').toMillis();
      const fin = Math.max(end, lastSlot || end);
      const totalMin = Math.max(Number.EPSILON, (fin - start) / 60000);
      const nptTotal = Math.min(nptMinRegistro + nptPorInactividad, totalMin);
      const minProd = Math.max(Number.EPSILON, totalMin - nptTotal);
      const avgProd = (totalPiezas / minProd) * 60;
      const avgSesion = (totalPiezas / totalMin) * 60;
      const ventanaMin = 10;
      const corte = fin - ventanaMin * 60000;
      const regsVentana = registrosOrdenados.filter(
        (r) =>
          DateTime.fromJSDate(r.minutoInicio, {
            zone: 'America/Bogota',
          }).toMillis() >= corte,
      );
      const piezasVentana = regsVentana.reduce(
        (a, b) => a + b.piezasContadas,
        0,
      );
      const nptVentanaReg = regsVentana.filter(
        (r) => r.pedaleadas === 0 && r.piezasContadas === 0,
      ).length;
      let nptVentanaGap = 0;
      for (let i = 1; i < regsVentana.length; i++) {
        const d = DateTime.fromJSDate(regsVentana[i].minutoInicio, {
          zone: 'America/Bogota',
        }).diff(
          DateTime.fromJSDate(regsVentana[i - 1].minutoInicio, {
            zone: 'America/Bogota',
          }),
          'minutes',
        ).minutes;
        if (d > minutosInactividadParaNPT)
          nptVentanaGap += d - minutosInactividadParaNPT;
      }
      const minVentana = Math.max(
        Number.EPSILON,
        (fin - Math.max(corte, start)) / 60000,
      );
      const minVentanaProd = Math.max(
        Number.EPSILON,
        minVentana - Math.min(nptVentanaReg + nptVentanaGap, minVentana),
      );
      const velocidadActual = (piezasVentana / minVentanaProd) * 60;
      const porcentajeNPT = totalMin > 0 ? (nptTotal / totalMin) * 100 : 0;

      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const estadoActual = estados[0];

      resultado.push({
        ...sesionConEstado,
        grupo: sesion.maquina?.tipo,
        estadoInicio: estadoActual?.inicio,
        avgSpeed: avgProd,
        avgSpeedSesion: avgSesion,
        velocidadActual,
        nptMin: nptMinRegistro,
        nptMinDia: nptTotal,
        nptPorInactividad,
        porcentajeNPT,
        defectos,
        produccionTotal: totalPiezas,
      });
    }

    return resultado.map((r) => this.formatSesionForResponse(r));
  }

  async findActivas() {
    const arr = await this.repo.find({
      where: { fechaFin: IsNull() },
      relations: ['trabajador', 'maquina'],
    });
    return arr.map((s) => this.formatSesionForResponse(s));
  }

  async findActivasResumen() {
    const arr = await this.repo
      .createQueryBuilder('s')
      .leftJoin('s.trabajador', 't')
      .leftJoin('s.maquina', 'm')
      .select(['s.id', 's.fechaInicio'])
      .addSelect(['t.id', 't.nombre'])
      .addSelect(['m.id', 'm.nombre'])
      .where('s.fechaFin IS NULL')
      .getMany();
    return arr.map((s) => this.formatSesionForResponse(s));
  }

  private async finalizarSesionesPrevias(trabajadorId: string) {
    const activas = await this.repo.find({
      where: {
        fechaFin: IsNull(),
        trabajador: { id: trabajadorId },
      },
    });

    for (const sesion of activas) {
      sesion.fechaFin = DateTime.now().setZone('America/Bogota').toJSDate();
      await this.repo.save(sesion);
    }
  }
}
