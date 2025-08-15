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
import { DateTime } from 'luxon';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';
import {
  EstadoSesion,
  TipoEstadoSesion,
} from '../estado-sesion/estado-sesion.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';

@Injectable()
export class SesionTrabajoService {
  constructor(
    @InjectRepository(SesionTrabajo)
    private readonly repo: Repository<SesionTrabajo>,
    private readonly registroMinutoService: RegistroMinutoService,
    private readonly estadoSesionService: EstadoSesionService,
    private readonly configService: ConfiguracionService,
    @InjectRepository(EstadoSesion)
    private readonly estadoSesionRepo: Repository<EstadoSesion>,
    @InjectRepository(EstadoTrabajador)
    private readonly estadoTrabajadorRepo: Repository<EstadoTrabajador>,
    @InjectRepository(EstadoMaquina)
    private readonly estadoMaquinaRepo: Repository<EstadoMaquina>,
    @InjectRepository(SesionTrabajoPaso)
    private readonly stpRepo: Repository<SesionTrabajoPaso>,
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

  async findOrdenProduccion(sesionId: string) {
    const relacion = await this.stpRepo
      .createQueryBuilder('stp')
      .innerJoinAndSelect('stp.pasoOrden', 'paso')
      .innerJoinAndSelect('paso.orden', 'orden')
      .leftJoin(
        'pausa_paso_sesion',
        'pausa',
        'pausa.pasoSesionId = stp.id AND pausa.fin IS NULL',
      )
      .where('stp.sesionTrabajoId = :sesionId', { sesionId })
      .andWhere('pausa.id IS NULL')
      .getOne();

    if (!relacion)
      throw new NotFoundException(
        'No se encontró asignación activa para la sesión',
      );

    const { pasoOrden } = relacion;
    const orden = pasoOrden.orden;
    delete (pasoOrden as any).orden;
    return { orden, paso: pasoOrden };
  }

  async update(id: string, dto: UpdateSesionTrabajoDto) {
    const sesion = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
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
    return this.formatSesionForResponse(saved);
  }

  async finalizar(id: string) {
    const sesion = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
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

      const ordenados = [...registros].sort(
        (a, b) =>
          DateTime.fromJSDate(a.minutoInicio, { zone: 'America/Bogota' }).toMillis() -
          DateTime.fromJSDate(b.minutoInicio, { zone: 'America/Bogota' }).toMillis(),
      );
      const registrosOrdenados = [...ordenados];
      const tieneRegistros = registrosOrdenados.length > 0;

      const sessionStart = DateTime.fromJSDate(sesion.fechaInicio, { zone: 'America/Bogota' }).toMillis();
      const lastSlot = tieneRegistros
        ? DateTime.fromJSDate(
            registrosOrdenados[registrosOrdenados.length - 1].minutoInicio,
            { zone: 'America/Bogota' },
          )
            .plus({ minutes: 1 })
            .toMillis()
        : 0;
      const end = sesion.fechaFin
        ? DateTime.fromJSDate(sesion.fechaFin, { zone: 'America/Bogota' }).toMillis()
        : DateTime.now().setZone('America/Bogota').toMillis();
      const fin = Math.max(end, lastSlot || end);
      const totalMin = Math.max(Number.EPSILON, (fin - sessionStart) / 60000);

      const gapSegments: number[] = [];
      if (!tieneRegistros) {
        gapSegments.push(totalMin);
      } else {
        const firstMs = DateTime.fromJSDate(registrosOrdenados[0].minutoInicio, { zone: 'America/Bogota' }).toMillis();
        const preGap = Math.max(0, (firstMs - sessionStart) / 60000);
        if (preGap > 0) gapSegments.push(preGap);
        for (let i = 1; i < registrosOrdenados.length; i++) {
          const prevMs = DateTime.fromJSDate(registrosOrdenados[i - 1].minutoInicio, { zone: 'America/Bogota' }).toMillis();
          const currMs = DateTime.fromJSDate(registrosOrdenados[i].minutoInicio, { zone: 'America/Bogota' }).toMillis();
          const diffMin = (currMs - prevMs) / 60000;
          const gapLen = Math.max(0, diffMin - 1);
          if (gapLen > 0) gapSegments.push(gapLen);
        }
        const postGap = Math.max(0, (fin - lastSlot) / 60000);
        if (postGap > 0) gapSegments.push(postGap);
      }

      const nptMin = gapSegments.reduce((a, b) => a + b, 0);

      const nptMinRegistro = registrosOrdenados.filter(
        (r) => r.pedaleadas === 0 && r.piezasContadas === 0,
      ).length;

      let nptPorInactividad = 0;
      if (!tieneRegistros) {
        const g = nptMin;
        if (g > minutosInactividadParaNPT) nptPorInactividad += g;
      } else {
        for (const g of gapSegments) {
          if (g > minutosInactividadParaNPT) nptPorInactividad += g;
        }
        let run = 0;
        let prevRunMs = 0;
        let hasPrevRun = false;
        for (let i = 0; i < registrosOrdenados.length; i++) {
          const curr = registrosOrdenados[i];
          const currMs = DateTime.fromJSDate(curr.minutoInicio, { zone: 'America/Bogota' }).toMillis();
          const zeroZero = curr.pedaleadas === 0 && curr.piezasContadas === 0;
          if (zeroZero) {
            if (hasPrevRun && currMs - prevRunMs === 60000) run += 1;
            else run = 1;
          } else {
            if (run > minutosInactividadParaNPT) nptPorInactividad += run;
            run = 0;
          }
          hasPrevRun = true;
          prevRunMs = currMs;
        }
        if (run > minutosInactividadParaNPT) nptPorInactividad += run;
      }

      const nptNoProductivoTotal = Math.min(totalMin, nptMin + nptMinRegistro);
      const minProd = Math.max(Number.EPSILON, totalMin - nptNoProductivoTotal);
      const avgProd = (totalPiezas / minProd) * 60;
      const avgSesion = (totalPiezas / totalMin) * 60;

      const ventanaMin = 10;
      const corte = fin - ventanaMin * 60000;
      const regsVentana = registrosOrdenados.filter(
        (r) =>
          DateTime.fromJSDate(r.minutoInicio, { zone: 'America/Bogota' }).toMillis() >= corte,
      );
      const piezasVentana = regsVentana.reduce((a, b) => a + b.piezasContadas, 0);

      const startVentana = Math.max(corte, sessionStart);
      const finVentana = fin;
      let gapSegmentsVentana: number[] = [];
      if (regsVentana.length === 0) {
        gapSegmentsVentana = [(finVentana - startVentana) / 60000];
      } else {
        const firstW = DateTime.fromJSDate(regsVentana[0].minutoInicio, { zone: 'America/Bogota' }).toMillis();
        const preW = Math.max(0, (firstW - startVentana) / 60000);
        if (preW > 0) gapSegmentsVentana.push(preW);
        for (let i = 1; i < regsVentana.length; i++) {
          const prevMs = DateTime.fromJSDate(regsVentana[i - 1].minutoInicio, { zone: 'America/Bogota' }).toMillis();
          const currMs = DateTime.fromJSDate(regsVentana[i].minutoInicio, { zone: 'America/Bogota' }).toMillis();
          const diffMin = (currMs - prevMs) / 60000;
          const gapLen = Math.max(0, diffMin - 1);
          if (gapLen > 0) gapSegmentsVentana.push(gapLen);
        }
        const lastWSlot = DateTime.fromJSDate(
          regsVentana[regsVentana.length - 1].minutoInicio,
          { zone: 'America/Bogota' },
        )
          .plus({ minutes: 1 })
          .toMillis();
        const postW = Math.max(0, (finVentana - lastWSlot) / 60000);
        if (postW > 0) gapSegmentsVentana.push(postW);
      }
      const nptVentanaGapOver = gapSegmentsVentana.reduce(
        (s, g) => s + (g > minutosInactividadParaNPT ? g : 0),
        0,
      );
      let runW = 0;
      let prevWms = 0;
      let hasPrevW = false;
      let nptVentanaZerosOver = 0;
      for (let i = 0; i < regsVentana.length; i++) {
        const reg = regsVentana[i];
        const currMs = DateTime.fromJSDate(reg.minutoInicio, { zone: 'America/Bogota' }).toMillis();
        const zeroZero = reg.pedaleadas === 0 && reg.piezasContadas === 0;
        if (zeroZero) {
          if (hasPrevW && currMs - prevWms === 60000) runW += 1;
          else runW = 1;
        } else {
          if (runW > minutosInactividadParaNPT) nptVentanaZerosOver += runW;
          runW = 0;
        }
        hasPrevW = true;
        prevWms = currMs;
      }
      if (runW > minutosInactividadParaNPT) nptVentanaZerosOver += runW;

      const minVentana = Math.max(Number.EPSILON, (finVentana - startVentana) / 60000);
      const inactividadVentana = Math.min(minVentana, nptVentanaGapOver + nptVentanaZerosOver);
      const minVentanaProd = Math.max(Number.EPSILON, minVentana - inactividadVentana);
      const velocidadActual = (piezasVentana / minVentanaProd) * 60;
      const porcentajeNPT = totalMin > 0 ? (Math.min(nptNoProductivoTotal, totalMin) / totalMin) * 100 : 0;

      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const estadoActual = estados[0];

      resultado.push({
        ...sesionConEstado,
        grupo: sesion.maquina?.tipo,
        estadoInicio: estadoActual?.inicio,
        avgSpeed: avgProd,
        avgSpeedSesion: avgSesion,
        velocidadActual,
        nptMin: nptMin,
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
