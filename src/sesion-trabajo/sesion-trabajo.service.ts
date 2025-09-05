import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, Not, In } from 'typeorm';
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
import { IndicadorSesionMinuto } from '../indicador-sesion-minuto/indicador-sesion-minuto.entity';
import { PausaPasoSesion } from '../pausa-paso-sesion/pausa-paso-sesion.entity';
import { IndicadorSesion } from '../indicador-sesion/indicador-sesion.entity';
import { IndicadorDiarioDim } from '../indicador-diario-dim/indicador-diario-dim.entity';
import { Maquina } from '../maquina/maquina.entity';


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
    @InjectRepository(IndicadorSesionMinuto)
    private readonly indicadorMinutoRepo: Repository<IndicadorSesionMinuto>,
    @InjectRepository(PausaPasoSesion)
    private readonly pausaRepo: Repository<PausaPasoSesion>,
    @InjectRepository(IndicadorSesion)
    private readonly indicadorSesionRepo: Repository<IndicadorSesion>,
    @InjectRepository(IndicadorDiarioDim)
    private readonly indicadorDiarioRepo: Repository<IndicadorDiarioDim>,
    @InjectRepository(Maquina)
    private readonly maquinaRepo: Repository<Maquina>,

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
    const maquina = await this.maquinaRepo.findOne({
      where: { id: dto.maquina },
      relations: ['area'],
    });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    const sesion = this.repo.create({
      trabajador: { id: dto.trabajador } as any,
      maquina: { id: dto.maquina } as any,
      areaIdSnapshot: maquina.area?.id ?? null,
      fechaInicio: this.toBogotaDate((dto as any).fechaInicio),
      fechaFin: undefined,
      cantidadProducida: 0,
      cantidadPedaleos: 0,
    });
    const saved = await this.repo.save(sesion);

    await this.estadoSesionService.create({
      sesionTrabajo: saved.id,
      estado: TipoEstadoSesion.INACTIVO,
      inicio: this.toBogotaDate((dto as any).fechaInicio),
    });

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
    const sesionConEstado = await this.mapSesionConEstado(sesion);
    const relaciones = await this.stpRepo.find({
      where: { sesionTrabajo: { id } },

      relations: ['pasoOrden', 'pasoOrden.orden'],

    });

    const indicador = await this.indicadorMinutoRepo.findOne({

      where: { sesionTrabajo: { id } },
      order: { minuto: 'DESC' },
    });
    return this.formatSesionForResponse({
      ...sesionConEstado,
      ...(indicador || {}),
      sesionesTrabajoPaso: relaciones.map((r) => ({
        ...r,
        estado: sesionConEstado.estadoSesion ?? TipoEstadoSesion.OTRO,
      })),
    });
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
      relations: ['trabajador', 'maquina', 'maquina.area'],
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

    const indicadores = await this.calcularIndicadoresSesion(sesion);
    const { count: pausasCount, minutos: pausasMin } = await this.obtenerPausas(
      sesion.id,
    );
    const totalProduccion =
      indicadores.produccionTotal + indicadores.defectos;
    const porcentajeDefectos =
      totalProduccion > 0
        ? (indicadores.defectos / totalProduccion) * 100
        : 0;
    const duracionSesionMin = Math.round(indicadores.totalMin);
    const porcentajePausa =
      duracionSesionMin > 0 ? (pausasMin / duracionSesionMin) * 100 : 0;
    const indicadoresMinuto = await this.indicadorMinutoRepo.find({
      where: { sesionTrabajo: { id } },
    });
    const velocidadMax10m = Math.max(
      indicadores.velocidadActual,
      ...indicadoresMinuto.map((i) => i.velocidadActual),
    );

    const areaId = (sesion.areaIdSnapshot ?? sesion.maquina.area?.id) as string;
    const nptMinInt = Math.round(indicadores.nptMin);
    const nptPorInactividadInt = Math.round(indicadores.nptPorInactividad);
    const nuevoIndicador = this.indicadorSesionRepo.create({
      sesionTrabajo: { id: sesion.id } as any,
      areaIdSnapshot: areaId,
      trabajadorId: sesion.trabajador.id,
      maquinaId: sesion.maquina.id,
      maquinaTipo: sesion.maquina.tipo,
      fechaInicio: sesion.fechaInicio,
      fechaFin: sesion.fechaFin!,
      produccionTotal: indicadores.produccionTotal,
      defectos: indicadores.defectos,
      porcentajeDefectos,
      avgSpeed: indicadores.avgSpeed,
      avgSpeedSesion: indicadores.avgSpeedSesion,
      velocidadMax10m,
      nptMin: nptMinInt,
      nptPorInactividad: nptPorInactividadInt,
      porcentajeNPT: indicadores.porcentajeNPT,
      pausasCount,
      pausasMin,
      porcentajePausa,
      duracionSesionMin,
      creadoEn: new Date(),
    });
    await this.indicadorSesionRepo.save(nuevoIndicador);

    const fecha = DateTime.fromJSDate(sesion.fechaInicio, {
      zone: 'America/Bogota',
    }).toISODate() as string;
    const diario = await this.indicadorDiarioRepo.findOne({
      where: {
        fecha,
        trabajadorId: sesion.trabajador.id,
        maquinaId: sesion.maquina.id,
        areaId,
      },
    });
    if (diario) {
      diario.produccionTotal += indicadores.produccionTotal;
      diario.defectos += indicadores.defectos;
      diario.nptMin += nptMinInt;
      diario.nptPorInactividad += nptPorInactividadInt;
      diario.pausasCount += pausasCount;
      diario.pausasMin += pausasMin;
      diario.duracionTotalMin += duracionSesionMin;
      diario.sesionesCerradas += 1;
      const totalProd = diario.produccionTotal + diario.defectos;
      diario.porcentajeDefectos =
        totalProd > 0 ? (diario.defectos / totalProd) * 100 : 0;
      diario.avgSpeed =
        (diario.produccionTotal /
          Math.max(
            Number.EPSILON,
            diario.duracionTotalMin -
              Math.min(diario.duracionTotalMin, diario.nptMin),
          )) *
        60;
      diario.avgSpeedSesion =
        (diario.produccionTotal /
          Math.max(Number.EPSILON, diario.duracionTotalMin)) *
        60;
      diario.porcentajeNPT =
        diario.duracionTotalMin > 0
          ? (Math.min(diario.nptMin, diario.duracionTotalMin) /
              diario.duracionTotalMin) *
            100
          : 0;
      diario.porcentajePausa =
        diario.duracionTotalMin > 0
          ? (diario.pausasMin / diario.duracionTotalMin) * 100
          : 0;
      diario.updatedAt = new Date();
      await this.indicadorDiarioRepo.save(diario);
    } else {
      const totalProd =
        indicadores.produccionTotal + indicadores.defectos;
      const porcentajeDefectosDia =
        totalProd > 0 ? (indicadores.defectos / totalProd) * 100 : 0;
      const porcentajeNPTDia =
        duracionSesionMin > 0
          ? (Math.min(nptMinInt, duracionSesionMin) /
              duracionSesionMin) *
            100
          : 0;
      const porcentajePausaDia = porcentajePausa;
      const nuevoDiario = this.indicadorDiarioRepo.create({
        fecha,
        trabajadorId: sesion.trabajador.id,
        maquinaId: sesion.maquina.id,
        areaId,
        produccionTotal: indicadores.produccionTotal,
        defectos: indicadores.defectos,
        porcentajeDefectos: porcentajeDefectosDia,
        avgSpeed: indicadores.avgSpeed,
        avgSpeedSesion: indicadores.avgSpeedSesion,
        nptMin: nptMinInt,
        nptPorInactividad: nptPorInactividadInt,
        porcentajeNPT: porcentajeNPTDia,
        pausasCount,
        pausasMin,
        porcentajePausa: porcentajePausaDia,
        duracionTotalMin: duracionSesionMin,
        sesionesCerradas: 1,
        updatedAt: new Date(),
      });
      await this.indicadorDiarioRepo.save(nuevoDiario);
    }

    await this.indicadorMinutoRepo
      .createQueryBuilder()
      .delete()
      .where('"sesionTrabajoId" = :id', { id })
      .execute();

    return this.formatSesionForResponse(sesion);
  }

  async remove(id: string) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    await this.repo.remove(sesion);
    return { deleted: true };
  }

  private async obtenerPausas(sesionId: string) {
    const pausas = await this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'ps')
      .innerJoin('ps.sesionTrabajo', 's')
      .where('s.id = :sesionId', { sesionId })
      .getMany();
    let minutos = 0;
    for (const p of pausas) {
      if (p.fin) {
        const inicio = DateTime.fromJSDate(p.inicio, {
          zone: 'America/Bogota',
        });
        const fin = DateTime.fromJSDate(p.fin, { zone: 'America/Bogota' });
        minutos += Math.round(fin.diff(inicio, 'minutes').minutes);
      }
    }
    return { count: pausas.length, minutos };
  }

  private ordenarRegistros(registros: any[]) {
    return [...registros].sort(
      (a, b) =>
        DateTime.fromJSDate(a.minutoInicio, { zone: 'America/Bogota' }).toMillis() -
        DateTime.fromJSDate(b.minutoInicio, { zone: 'America/Bogota' }).toMillis(),
    );
  }
  
  private obtenerTiemposSesion(sesion: any, registrosOrdenados: any[]) {
    const tieneRegistros = registrosOrdenados.length > 0;
    const sessionStart = DateTime.fromJSDate(sesion.fechaInicio, { zone: 'America/Bogota' }).toMillis();
    const lastSlot = tieneRegistros
      ? DateTime.fromJSDate(registrosOrdenados[registrosOrdenados.length - 1].minutoInicio, { zone: 'America/Bogota' }).plus({ minutes: 1 }).toMillis()
      : 0;
    const ahoraMs = DateTime.now().setZone('America/Bogota').toMillis();
    const fechaFinMs = sesion.fechaFin ? DateTime.fromJSDate(sesion.fechaFin, { zone: 'America/Bogota' }).toMillis() : null;
    const endRef = fechaFinMs ?? ahoraMs;
    const fin = Math.max(endRef, lastSlot || endRef);
    const totalMin = Math.max(Number.EPSILON, (fin - sessionStart) / 60000);
    return { tieneRegistros, sessionStart, lastSlot, fin, totalMin };
  }
  
  private aggregates(registros: any[]) {
    const totalPiezas = registros.reduce((a, b) => a + b.piezasContadas, 0);
    const totalPedales = registros.reduce((a, b) => a + b.pedaleadas, 0);
    const defectos = totalPedales - totalPiezas;
    return { totalPiezas, totalPedales, defectos };
  }
  
  private promedios(totalPiezas: number, totalMin: number, nptNoProductivoTotal: number) {
    const minProd = Math.max(Number.EPSILON, totalMin - Math.min(totalMin, nptNoProductivoTotal));
    const avgProd = (totalPiezas / minProd) * 60;
    const avgSesion = (totalPiezas / totalMin) * 60;
    return { avgProd, avgSesion };
  }
  private construirSegmentosInactividad(registrosOrdenados: any[], sessionStart: number, fin: number) {
    const segments: number[] = [];
    let cursor = sessionStart;
    let run = 0;
    for (let i = 0; i < registrosOrdenados.length; i++) {
      const r = registrosOrdenados[i];
      const t = DateTime.fromJSDate(r.minutoInicio, { zone: 'America/Bogota' }).toMillis();
      if (t > cursor) {
        const miss = Math.floor((t - cursor) / 60000);
        if (miss > 0) { run += miss; cursor += miss * 60000; }
      }
      const zero = r.pedaleadas === 0 && r.piezasContadas === 0;
      if (t >= cursor) {
        if (zero) { run += 1; cursor = t + 60000; }
        else { if (run > 0) { segments.push(run); run = 0; } cursor = t + 60000; }
      } else {
        if (!zero && run > 0) { segments.push(run); run = 0; }
      }
    }
    if (fin > cursor) {
      const tail = Math.ceil((fin - cursor) / 60000);
      if (tail > 0) run += tail;
    }
    if (run > 0) segments.push(run);
    return segments;
  }
  
  private nptMinUnifiedFrom(segments: number[]) {
    return segments.reduce((a, b) => a + b, 0);
  }
  
  private nptPorInactividadFromSegments(segments: number[], minutosInactividadParaNPT: number) {
    return segments.reduce((s, g) => s + (g > minutosInactividadParaNPT ? g : 0), 0);
  }

  private ventanaMetrics(registrosOrdenados: any[], ventanaMin: number, fin: number, sessionStart: number, minutosInactividadParaNPT: number) {
    const corte = fin - ventanaMin * 60000;
    const startVentana = Math.max(corte, sessionStart);
    const finVentana = fin;
    const regsVentana = registrosOrdenados.filter(r => DateTime.fromJSDate(r.minutoInicio, { zone: 'America/Bogota' }).toMillis() >= startVentana);
    const piezasVentana = regsVentana.reduce((a, b) => a + b.piezasContadas, 0);
    const segments = this.construirSegmentosInactividad(regsVentana, startVentana, finVentana);
    const minVentana = Math.max(Number.EPSILON, (finVentana - startVentana) / 60000);
    const inactividadOver = segments.reduce((s, g) => s + (g > minutosInactividadParaNPT ? g : 0), 0);
    const minVentanaProd = Math.max(Number.EPSILON, minVentana - Math.min(minVentana, inactividadOver));
    const velocidadActual = (piezasVentana / minVentanaProd) * 60;
    return { velocidadActual };
  }
  
  private porcentajeNPTFrom(totalMin: number, nptNoProductivoTotal: number) {
    return totalMin > 0 ? (Math.min(nptNoProductivoTotal, totalMin) / totalMin) * 100 : 0;
  }

  async calcularIndicadoresSesion(sesion: SesionTrabajo) {
    const minutosInactividadParaNPT = await this.configService.getMinInactividad();
    const registros = await this.registroMinutoService.obtenerPorSesion(sesion.id);
    const registrosOrdenados = this.ordenarRegistros(registros);
    const { sessionStart, fin, totalMin } = this.obtenerTiemposSesion(
      sesion,
      registrosOrdenados,
    );
    const segmentosInactivos = this.construirSegmentosInactividad(
      registrosOrdenados,
      sessionStart,
      fin,
    );
    const { totalPiezas, totalPedales, defectos } = this.aggregates(registros);
    const nptMin = this.nptMinUnifiedFrom(segmentosInactivos);
    const nptPorInactividad = this.nptPorInactividadFromSegments(
      segmentosInactivos,
      minutosInactividadParaNPT,
    );
    const nptNoProductivoTotal = Math.min(totalMin, nptMin);
    const { avgProd, avgSesion } = this.promedios(
      totalPiezas,
      totalMin,
      nptNoProductivoTotal,
    );
    const { velocidadActual } = this.ventanaMetrics(
      registrosOrdenados,
      10,
      fin,
      sessionStart,
      minutosInactividadParaNPT,
    );
    const porcentajeNPT = this.porcentajeNPTFrom(totalMin, nptNoProductivoTotal);
    return {
      produccionTotal: totalPiezas,
      defectos,
      avgSpeed: avgProd,
      avgSpeedSesion: avgSesion,
      velocidadActual,
      nptMin: nptNoProductivoTotal,
      nptPorInactividad,
      porcentajeNPT,
      totalMin,
    };
  }
  
  async findActuales() {
    const sesiones = await this.repo.find({
      where: { fechaFin: IsNull() },
      relations: ['trabajador', 'maquina'],
    });
    const resultado: any[] = [];
    for (const sesion of sesiones) {
      const sesionConEstado = await this.mapSesionConEstado(sesion);
      const indicador = await this.indicadorMinutoRepo.findOne({

        where: { sesionTrabajo: { id: sesion.id } },
        order: { minuto: 'DESC' },
      });
      let data: any = indicador;
      if (!data) {
        data = await this.calcularIndicadoresSesion(sesion);
      }
      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const estadoActual = estados[0];
      resultado.push({
        ...sesionConEstado,
        grupo: sesion.maquina?.tipo,
        estadoInicio: estadoActual?.inicio,
        avgSpeed: data.avgSpeed,
        avgSpeedSesion: data.avgSpeedSesion,
        velocidadActual: data.velocidadActual,
        nptMin: data.nptMin,
        nptPorInactividad: data.nptPorInactividad,
        porcentajeNPT: data.porcentajeNPT,
        defectos: data.defectos,
        produccionTotal: data.produccionTotal,
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

  async finalizarTodas() {
    const sesiones = await this.repo.find({
      where: { fechaFin: IsNull() },
      select: ['id'],
    });
    const resultados: { id: string; ok: boolean; error?: string }[] = [];
    for (const s of sesiones) {
      try {
        await this.finalizar(s.id);
        resultados.push({ id: s.id, ok: true });
      } catch (e: any) {
        resultados.push({ id: s.id, ok: false, error: e?.message ?? 'Error' });
      }
    }
    return {
      total: sesiones.length,
      finalizadas: resultados.filter((r) => r.ok).map((r) => r.id),
      noFinalizadas: resultados
        .filter((r) => !r.ok)
        .map((r) => ({ id: r.id, motivo: r.error })),
    };
  }

  async serieMinutoPorSesion(
    sesionId: string,
    inicioISO?: string,
    finISO?: string,
  ) {
    const where: any = { sesionTrabajo: { id: sesionId } };
    if (inicioISO && finISO) {
      where.minuto = Between(
        DateTime.fromISO(inicioISO, { zone: 'America/Bogota' }).startOf('minute').toJSDate(),
        DateTime.fromISO(finISO, { zone: 'America/Bogota' }).endOf('minute').toJSDate(),
      );
    }
    const rows = await this.indicadorMinutoRepo.find({
      where,
      order: { minuto: 'ASC' },
    });
    return rows.map((r) => ({
      sesionTrabajoId: sesionId,
      minuto: r.minuto,
      produccionTotal: r.produccionTotal,
      defectos: r.defectos,
      porcentajeDefectos: r.porcentajeDefectos,
      avgSpeed: r.avgSpeed,
      avgSpeedSesion: r.avgSpeedSesion,
      velocidadActual: r.velocidadActual,
      nptMin: Number(r.nptMin),
      nptPorInactividad: Number(r.nptPorInactividad),
      porcentajeNPT: r.porcentajeNPT,
      pausasCount: r.pausasCount,
      pausasMin: r.pausasMin,
      porcentajePausa: r.porcentajePausa,
      duracionSesionMin: r.duracionSesionMin,
      actualizadoEn: r.actualizadoEn,
    }));
  }

  // ---- Indicadores en tiempo real por área (serie promedio normalizada del día) ----
  async velocidadAreaTiempoReal(areaId?: string) {
    // 1) Obtener sesiones activas (fechaFin NULL). Filtrar por área si se solicita.
    const sesiones = await this.repo.find({
      where: { fechaFin: IsNull() },
      relations: ['maquina', 'maquina.area'],
    });
    const areaDe = (s: SesionTrabajo) => (s.areaIdSnapshot ?? s.maquina.area?.id) as string | undefined;
    const activas = sesiones.filter((s) => !!areaDe(s) && (!areaId || areaDe(s) === areaId));

    // 2) Mapear sesiones por área y armar lookup de área por sesión
    const porArea = new Map<string, string[]>(); // areaId -> [sesionId]
    const areaBySesion = new Map<string, string>();
    for (const s of activas) {
      const a = areaDe(s)!;
      porArea.set(a, [...(porArea.get(a) || []), s.id]);
      areaBySesion.set(s.id, a);
    }

    // 3) Consultar todos los minutos del día actual para esas sesiones y calcular
    //    promedio normalizado por minuto, alineando por timestamp (minuto exacto)
    const zone = 'America/Bogota';
    const start = DateTime.now().setZone(zone).startOf('day').toJSDate();
    const end = DateTime.now().setZone(zone).toJSDate();

    const todasSesionesIds = Array.from(areaBySesion.keys());
    if (todasSesionesIds.length === 0) {
      if (areaId) return { areaId, inicio: DateTime.fromJSDate(start, { zone }).toISO(), fin: DateTime.fromJSDate(end, { zone }).toISO(), sesiones: 0, puntos: [] as any[] };
      return [] as any[];
    }

    // Traer filas crudas con sesionId para agrupar y normalizar por sesión
    const rows = await this.indicadorMinutoRepo
      .createQueryBuilder('m')
      .select(['m.minuto AS minuto', 'm.velocidadActual AS velocidad', 'm.sesionTrabajoId AS sid'])
      .where('m.sesionTrabajoId IN (:...ids)', { ids: todasSesionesIds })
      .andWhere('m.minuto BETWEEN :inicio AND :fin', { inicio: start, fin: end })
      .orderBy('m.minuto', 'ASC')
      .getRawMany<{ minuto: Date; velocidad: number; sid: string }>();

    // 4) Calcular promedio de cada sesión para normalizar
    const sumBySesion = new Map<string, { sum: number; c: number }>();
    for (const r of rows) {
      const d = sumBySesion.get(r.sid) || { sum: 0, c: 0 };
      d.sum += Number(r.velocidad || 0);
      d.c += 1;
      sumBySesion.set(r.sid, d);
    }
    const meanBySesion = new Map<string, number>();
    for (const [sid, d] of sumBySesion.entries()) {
      meanBySesion.set(sid, d.c > 0 ? d.sum / d.c : 0);
    }

    // 5) Acumular por área y minuto: promedio de (velocidad / meanSesion)
    const byAreaMinute = new Map<string, Map<string, { sum: number; c: number }>>();
    for (const r of rows) {
      const a = areaBySesion.get(r.sid);
      if (!a) continue;
      const mean = meanBySesion.get(r.sid) || 0;
      const norm = mean > 0 ? Number(r.velocidad || 0) / mean : 0;
      const minutoKey = DateTime.fromJSDate(r.minuto, { zone }).toISO({ suppressSeconds: true, includeOffset: false });
      const inner = byAreaMinute.get(a) || new Map<string, { sum: number; c: number }>();
      const curr = inner.get(minutoKey) || { sum: 0, c: 0 };
      curr.sum += norm;
      curr.c += 1;
      inner.set(minutoKey, curr);
      byAreaMinute.set(a, inner);
    }

    // 6) Armar salida
    const buildSerie = (a: string) => {
      const inner = byAreaMinute.get(a) || new Map<string, { sum: number; c: number }>();
      const puntos = Array.from(inner.entries())
        .sort(([k1], [k2]) => (k1 < k2 ? -1 : k1 > k2 ? 1 : 0))
        .map(([minuto, d]) => ({ minuto, meanNorm: d.c > 0 ? d.sum / d.c : 0 }));
      return {
        areaId: a,
        inicio: DateTime.fromJSDate(start, { zone }).toISO(),
        fin: DateTime.fromJSDate(end, { zone }).toISO(),
        sesiones: (porArea.get(a) || []).length,
        puntos,
        normalizacion: 'mean-per-sesion',
      };
    };

    if (areaId) return buildSerie(areaId);
    return Array.from(porArea.keys()).map((a) => buildSerie(a));
  }

  // ---- Velocidad normalizada por sesiones en rango (con normalización por sesión) ----
  async velocidadNormalizadaRango(
    inicioISO: string,
    finISO: string,
    areaId?: string,
    points = 50,
  ) {
    const inicio = DateTime.fromISO(inicioISO, { zone: 'America/Bogota' }).toJSDate();
    const fin = DateTime.fromISO(finISO, { zone: 'America/Bogota' }).toJSDate();
    const sesiones = await this.repo.find({
      where: {
        fechaInicio: Between(inicio, fin),
        fechaFin: Not(IsNull()),
      },
      relations: ['maquina', 'maquina.area'],
    });
    const candidatas = areaId
      ? sesiones.filter((s) => (s.areaIdSnapshot ?? s.maquina.area?.id) === areaId)
      : sesiones;

    const series: number[][] = [];
    for (const s of candidatas) {
      const rows = await this.indicadorMinutoRepo.find({
        where: { sesionTrabajo: { id: s.id } },
        order: { minuto: 'ASC' },
      });
      if (rows.length < 2) continue;
      const arrRaw = rows.map((r) => r.velocidadActual || 0);
      const mean = arrRaw.length > 0 ? arrRaw.reduce((a, b) => a + b, 0) / arrRaw.length : 0;
      const arr = mean > 0 ? arrRaw.map((v) => v / mean) : arrRaw.map(() => 0);
      const n = arr.length;
      const target: number[] = [];
      for (let i = 0; i < points; i++) {
        const idx = Math.round((i * (n - 1)) / (points - 1));
        target.push(arr[idx]);
      }
      series.push(target);
    }
    const mean: number[] = Array.from({ length: points }, (_, i) => {
      let sum = 0;
      let c = 0;
      for (const s of series) {
        if (Number.isFinite(s[i])) {
          sum += s[i];
          c++;
        }
      }
      return c > 0 ? sum / c : 0;
    });
    return {
      inicio: inicioISO,
      fin: finISO,
      areaId: areaId ?? null,
      points,
      sesiones: series.length,
      mean,
      normalizacion: 'mean-per-sesion',
    };
  }

  // ---- Resumen por trabajador en rango ----
  async resumenTrabajadorRango(
    trabajadorId: string,
    inicioISO: string,
    finISO: string,
    includeVentana = false,
  ) {
    const inicio = DateTime.fromISO(inicioISO, { zone: 'America/Bogota' }).toISODate()!;
    const fin = DateTime.fromISO(finISO, { zone: 'America/Bogota' }).toISODate()!;
    const rows = await this.indicadorDiarioRepo
      .createQueryBuilder('i')
      .select('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.trabajadorId = :trabajadorId', { trabajadorId })
      .andWhere('i.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .getRawOne<{
        produccionTotal: string;
        defectos: string;
        nptMin: string;
        nptPorInactividad: string;
        pausasMin: string;
        duracionTotalMin: string;
        sesionesCerradas: string;
      }>();

    const base = {
      produccionTotal: Number(rows?.produccionTotal || 0),
      defectos: Number(rows?.defectos || 0),
      nptMin: Number(rows?.nptMin || 0),
      nptPorInactividad: Number(rows?.nptPorInactividad || 0),
      pausasMin: Number(rows?.pausasMin || 0),
      duracionTotalMin: Number(rows?.duracionTotalMin || 0),
      sesionesCerradas: Number(rows?.sesionesCerradas || 0),
    };
    const totalPiezas = base.produccionTotal;
    const totalPedaleos = base.produccionTotal + base.defectos;
    const porcentajeDefectos = totalPedaleos > 0 ? (base.defectos / totalPedaleos) * 100 : 0;
    const nptCapped = Math.min(base.nptMin, base.duracionTotalMin);
    const porcentajeNPT = base.duracionTotalMin > 0 ? (nptCapped / base.duracionTotalMin) * 100 : 0;
    const porcentajePausa = base.duracionTotalMin > 0 ? (base.pausasMin / base.duracionTotalMin) * 100 : 0;
    const avgSpeedSesion = base.duracionTotalMin > 0 ? (totalPiezas / base.duracionTotalMin) * 60 : 0;
    const minProd = Math.max(Number.EPSILON, base.duracionTotalMin - Math.min(base.duracionTotalMin, base.nptMin));
    const avgSpeed = (totalPiezas / minProd) * 60;

    let velocidadVentanaPromedio: number | undefined = undefined;
    if (includeVentana) {
      // Buscar sesiones del trabajador en rango y promediar velocidadActual de sus minutos
      const sesiones = await this.repo.find({
        where: {
          trabajador: { id: trabajadorId } as any,
          fechaInicio: Between(DateTime.fromISO(inicioISO, { zone: 'America/Bogota' }).toJSDate(), DateTime.fromISO(finISO, { zone: 'America/Bogota' }).toJSDate()),
        },
      });
      if (sesiones.length > 0) {
        const minutos = await this.indicadorMinutoRepo.find({
          where: { sesionTrabajo: { id: In(sesiones.map((s) => s.id)) } as any },
        });
        const vals = minutos.map((m) => m.velocidadActual || 0);
        const sum = vals.reduce((a, b) => a + b, 0);
        velocidadVentanaPromedio = vals.length > 0 ? sum / vals.length : 0;
      } else {
        velocidadVentanaPromedio = 0;
      }
    }

    return {
      trabajadorId,
      inicio: inicioISO,
      fin: finISO,
      ...base,
      porcentajeDefectos,
      porcentajeNPT,
      porcentajePausa,
      avgSpeed,
      avgSpeedSesion,
      velocidadVentanaPromedio,
    };
  }

  // ---- Resumen por máquina en rango ----
  async resumenMaquinaRango(
    maquinaId: string,
    inicioISO: string,
    finISO: string,
    includeVentana = false,
  ) {
    const inicio = DateTime.fromISO(inicioISO, { zone: 'America/Bogota' }).toISODate()!;
    const fin = DateTime.fromISO(finISO, { zone: 'America/Bogota' }).toISODate()!;
    const rows = await this.indicadorDiarioRepo
      .createQueryBuilder('i')
      .select('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.maquinaId = :maquinaId', { maquinaId })
      .andWhere('i.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .getRawOne<{
        produccionTotal: string;
        defectos: string;
        nptMin: string;
        nptPorInactividad: string;
        pausasMin: string;
        duracionTotalMin: string;
        sesionesCerradas: string;
      }>();

    const base = {
      produccionTotal: Number(rows?.produccionTotal || 0),
      defectos: Number(rows?.defectos || 0),
      nptMin: Number(rows?.nptMin || 0),
      nptPorInactividad: Number(rows?.nptPorInactividad || 0),
      pausasMin: Number(rows?.pausasMin || 0),
      duracionTotalMin: Number(rows?.duracionTotalMin || 0),
      sesionesCerradas: Number(rows?.sesionesCerradas || 0),
    };
    const totalPiezas = base.produccionTotal;
    const totalPedaleos = base.produccionTotal + base.defectos;
    const porcentajeDefectos = totalPedaleos > 0 ? (base.defectos / totalPedaleos) * 100 : 0;
    const nptCapped = Math.min(base.nptMin, base.duracionTotalMin);
    const porcentajeNPT = base.duracionTotalMin > 0 ? (nptCapped / base.duracionTotalMin) * 100 : 0;
    const porcentajePausa = base.duracionTotalMin > 0 ? (base.pausasMin / base.duracionTotalMin) * 100 : 0;
    const avgSpeedSesion = base.duracionTotalMin > 0 ? (totalPiezas / base.duracionTotalMin) * 60 : 0;
    const minProd = Math.max(Number.EPSILON, base.duracionTotalMin - Math.min(base.duracionTotalMin, base.nptMin));
    const avgSpeed = (totalPiezas / minProd) * 60;

    let velocidadVentanaPromedio: number | undefined = undefined;
    if (includeVentana) {
      const sesiones = await this.repo.find({
        where: {
          maquina: { id: maquinaId } as any,
          fechaInicio: Between(DateTime.fromISO(inicioISO, { zone: 'America/Bogota' }).toJSDate(), DateTime.fromISO(finISO, { zone: 'America/Bogota' }).toJSDate()),
        },
      });
      if (sesiones.length > 0) {
        const minutos = await this.indicadorMinutoRepo.find({
          where: { sesionTrabajo: { id: In(sesiones.map((s) => s.id)) } as any },
        });
        const vals = minutos.map((m) => m.velocidadActual || 0);
        const sum = vals.reduce((a, b) => a + b, 0);
        velocidadVentanaPromedio = vals.length > 0 ? sum / vals.length : 0;
      } else {
        velocidadVentanaPromedio = 0;
      }
    }

    return {
      maquinaId,
      inicio: inicioISO,
      fin: finISO,
      ...base,
      porcentajeDefectos,
      porcentajeNPT,
      porcentajePausa,
      avgSpeed,
      avgSpeedSesion,
      velocidadVentanaPromedio,
    };
  }

}
