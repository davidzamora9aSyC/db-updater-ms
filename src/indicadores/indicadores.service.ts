import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { IndicadorDiarioDim } from '../indicador-diario-dim/indicador-diario-dim.entity';
import { Area } from '../area/area.entity';
import { Trabajador } from '../trabajador/trabajador.entity';
import { Maquina } from '../maquina/maquina.entity';
import { OrdenProduccion } from '../orden-produccion/entity';
import { PasoProduccion } from '../paso-produccion/paso-produccion.entity';
import { RegistroMinuto } from '../registro-minuto/registro-minuto.entity';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { FuenteDatosSesion } from '../sesion-trabajo/sesion-trabajo.entity';

type SumRow = {
  clave: Date | string;
  areaId?: string | null;
  produccionTotal: string | number;
  defectos: string | number;
  nptMin: string | number;
  nptPorInactividad: string | number;
  pausasMin: string | number;
  duracionTotalMin: string | number;
  sesionesCerradas: string | number;
};

@Injectable()
export class IndicadoresService {
  private readonly zone = 'America/Bogota';

  constructor(
    @InjectRepository(IndicadorDiarioDim)
    private readonly repo: Repository<IndicadorDiarioDim>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(Trabajador)
    private readonly trabajadorRepo: Repository<Trabajador>,
    @InjectRepository(Maquina)
    private readonly maquinaRepo: Repository<Maquina>,
    @InjectRepository(OrdenProduccion)
    private readonly ordenRepo: Repository<OrdenProduccion>,
    @InjectRepository(RegistroMinuto)
    private readonly registroRepo: Repository<RegistroMinuto>,
    private readonly configService: ConfiguracionService,
  ) {}

  private excludeTabletFuente<T extends { andWhere: (...args: any[]) => T }>(qb: T, alias = 'i') {
    return qb.andWhere(`(${alias}.fuente IS NULL OR ${alias}.fuente != :tabletFuente)`, {
      tabletFuente: FuenteDatosSesion.TABLET,
    });
  }

  private calcMetrics(base: {
    produccionTotal: number;
    defectos: number;
    nptMin: number;
    nptPorInactividad: number;
    pausasMin: number;
    duracionTotalMin: number;
    sesionesCerradas: number;
  }) {
    const totalPiezas = base.produccionTotal;
    const totalPedaleos = base.produccionTotal + base.defectos; // pedaleadas = ok + defectos
    const porcentajeDefectos = totalPedaleos > 0 ? (base.defectos / totalPedaleos) * 100 : 0;
    const nptCapped = Math.min(base.nptMin, base.duracionTotalMin);
    const porcentajeNPT = base.duracionTotalMin > 0 ? (nptCapped / base.duracionTotalMin) * 100 : 0;
    const porcentajePausa = base.duracionTotalMin > 0 ? (base.pausasMin / base.duracionTotalMin) * 100 : 0;
    const avgSpeedSesion = base.duracionTotalMin > 0 ? (totalPiezas / base.duracionTotalMin) * 60 : 0;
    const minProd = Math.max(Number.EPSILON, base.duracionTotalMin - Math.min(base.duracionTotalMin, base.nptMin));
    const avgSpeed = (totalPiezas / minProd) * 60;
    return {
      ...base,
      porcentajeDefectos,
      porcentajeNPT,
      porcentajePausa,
      avgSpeed,
      avgSpeedSesion,
    };
  }

  private rangoFechas(
    opts: { rango?: string; inicio?: string; fin?: string },
  ): { inicio: string; fin: string } {
    const now = DateTime.now().setZone(this.zone);
    const { rango, inicio, fin } = opts;
    if (inicio && fin) {
      return {
        inicio: DateTime.fromISO(inicio, { zone: this.zone })
          .startOf('day')
          .toISODate()!,
        fin: DateTime.fromISO(fin, { zone: this.zone }).endOf('day').toISODate()!,
      };
    }
    switch ((rango || '').toLowerCase()) {
      case 'hoy':
      case 'dia':
      case 'today':
        return { inicio: now.startOf('day').toISODate()!, fin: now.endOf('day').toISODate()! };
      case 'semana':
      case 'esta-semana':
      case 'week':
        return {
          inicio: now.startOf('week').toISODate()!,
          fin: now.endOf('day').toISODate()!,
        };
      case 'mes':
      case 'este-mes':
      case 'mes-actual':
      case 'month':
        return {
          inicio: now.startOf('month').toISODate()!,
          fin: now.endOf('day').toISODate()!,
        };
      case 'ultimos-30-dias':
      case 'last-30-days':
        return {
          inicio: now.minus({ days: 29 }).startOf('day').toISODate()!,
          fin: now.endOf('day').toISODate()!,
        };
      case 'ano':
      case 'este-ano':
      case 'año':
      case 'year':
        return {
          inicio: now.startOf('year').toISODate()!,
          fin: now.endOf('day').toISODate()!,
        };
      case 'ultimos-12-meses':
      case 'last-12-months':
        return {
          inicio: now.minus({ months: 11 }).startOf('month').toISODate()!,
          fin: now.endOf('month').toISODate()!,
        };
      default:
        return { inicio: now.startOf('day').toISODate()!, fin: now.endOf('day').toISODate()! };
    }
  }

  private pickMetrics<T extends Record<string, any>>(obj: T, allow?: string[] | null) {
    if (!allow || allow.length === 0) return obj;
    const baseKeys = ['id', 'nombre', 'identificacion', 'grupo', 'turno', 'tipo', 'areaId', 'areaNombre'];
    const out: any = {};
    for (const k of baseKeys) if (k in obj) out[k] = obj[k];
    for (const k of allow) if (k in obj) out[k] = obj[k];
    return out;
  }

  private round(valor: number, decimales = 2) {
    if (!Number.isFinite(valor)) return valor;
    const factor = 10 ** decimales;
    return Math.round(valor * factor) / factor;
  }

  private variacionPorcentual(actual: number | null | undefined, comparativo: number | null | undefined) {
    if (actual == null || comparativo == null) return null;
    if (!Number.isFinite(actual) || !Number.isFinite(comparativo)) return null;
    if (Math.abs(comparativo) < 1e-9) {
      return Math.abs(actual) < 1e-9 ? 0 : null;
    }
    return ((actual - comparativo) / Math.abs(comparativo)) * 100;
  }

  private resolverPeriodoProducto(opts: { periodo?: string; inicio?: string; fin?: string }) {
    if (opts.inicio && opts.fin) {
      const inicio = DateTime.fromISO(opts.inicio, { zone: this.zone }).startOf('day');
      const fin = DateTime.fromISO(opts.fin, { zone: this.zone }).endOf('day');
      if (!inicio.isValid || !fin.isValid) {
        throw new BadRequestException('Parámetros de fecha inválidos');
      }
      return { inicio, fin };
    }
    const base = DateTime.now().setZone(this.zone);
    const periodo = (opts.periodo ?? '').toLowerCase();
    switch (periodo) {
      case 'diario':
      case 'dia':
      case 'día':
        return { inicio: base.startOf('day'), fin: base.endOf('day') };
      case 'semanal':
      case 'semana':
        return { inicio: base.startOf('week'), fin: base.endOf('week') };
      case 'mensual':
      case 'mes':
        return { inicio: base.startOf('month'), fin: base.endOf('month') };
      default:
        return { inicio: base.startOf('day'), fin: base.endOf('day') };
    }
  }

  private resolverComparativoProducto(
    base: { inicio: DateTime; fin: DateTime },
    opts: { compararCon?: string; compararInicio?: string; compararFin?: string },
  ) {
    const normalizado = (opts.compararCon ?? 'previo').toLowerCase().replace(/[\s_-]/g, '');
    if (normalizado === 'ninguno' || normalizado === 'none' || normalizado === 'sincomparacion') {
      return null;
    }
    if (normalizado === 'personalizado') {
      if (!opts.compararInicio || !opts.compararFin) return null;
      const inicio = DateTime.fromISO(opts.compararInicio, { zone: this.zone }).startOf('day');
      const fin = DateTime.fromISO(opts.compararFin, { zone: this.zone }).endOf('day');
      if (!inicio.isValid || !fin.isValid) return null;
      return { inicio, fin, tipo: 'personalizado' as const };
    }
    if (normalizado === 'mismoperiodoanterior' || normalizado === 'mismoperiodo' || normalizado === 'anterioranio') {
      return {
        inicio: base.inicio.minus({ years: 1 }),
        fin: base.fin.minus({ years: 1 }),
        tipo: 'mismoPeriodoAnterior' as const,
      };
    }
    const duracion = base.fin.diff(base.inicio);
    return {
      inicio: base.inicio.minus(duracion),
      fin: base.fin.minus(duracion),
      tipo: 'previo' as const,
    };
  }

  private async obtenerPlaneadoProducto(producto: string, inicio: DateTime, fin: DateTime) {
    const row = await this.ordenRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.cantidadAProducir),0)', 'planeadas')
      .where('o.producto = :producto', { producto })
      .andWhere(
        'o.fechaOrden <= :fin AND o.fechaVencimiento >= :inicio',
        {
          inicio: inicio.toISODate(),
          fin: fin.toISODate(),
        },
      )
      .getRawOne<{ planeadas: string }>();
    return this.toNum(row?.planeadas);
  }

  private async obtenerProduccionProducto(producto: string, inicio: DateTime, fin: DateTime) {
    const row = await this.registroRepo
      .createQueryBuilder('r')
      .innerJoin('r.pasoSesionTrabajo', 'stp')
      .innerJoin('r.sesionTrabajo', 'st')
      .innerJoin('stp.pasoOrden', 'p')
      .innerJoin('p.orden', 'o')
      .select('COALESCE(SUM(r.piezasContadas),0)', 'piezas')
      .addSelect('COALESCE(SUM(r.pedaleadas),0)', 'pedaleadas')
      .where('o.producto = :producto', { producto })
      .andWhere('r.minutoInicio BETWEEN :inicio AND :fin', {
        inicio: inicio.toJSDate(),
        fin: fin.toJSDate(),
      })
      .andWhere('(st.fuente IS NULL OR st.fuente != :tabletFuente)', {
        tabletFuente: FuenteDatosSesion.TABLET,
      })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(p2.numeroPaso)')
          .from(PasoProduccion, 'p2')
          .where('p2."ordenId" = o.id')
          .getQuery();
        return `p.numeroPaso = ${subQuery}`;
      })
      .getRawOne<{ piezas: string; pedaleadas: string }>();
    const piezas = this.toNum(row?.piezas);
    const pedaleadasRaw = this.toNum(row?.pedaleadas);
    const defectos = Math.max(0, pedaleadasRaw - piezas);
    const totalInspeccionadas = piezas + defectos;
    return { piezas, pedaleadas: totalInspeccionadas, defectos };
  }

  private construirSegmentosInactividadProducto(
    registros: { minuto: Date; pedaleadas: number; piezas: number }[],
    inicio: DateTime,
    fin: DateTime,
  ) {
    const segmentos: number[] = [];
    if (!registros.length) return segmentos;
    const inicioMs = Math.max(
      inicio.toMillis(),
      DateTime.fromJSDate(registros[0].minuto, { zone: this.zone }).startOf('minute').toMillis(),
    );
    const finMs = Math.min(
      fin.toMillis(),
      DateTime.fromJSDate(registros[registros.length - 1].minuto, { zone: this.zone })
        .startOf('minute')
        .plus({ minutes: 1 })
        .toMillis(),
    );
    if (finMs <= inicioMs) return segmentos;
    let cursor = inicioMs;
    let racha = 0;
    for (const registro of registros) {
      const minutoMs = DateTime.fromJSDate(registro.minuto, { zone: this.zone }).startOf('minute').toMillis();
      if (minutoMs < inicioMs) continue;
      if (minutoMs > finMs) break;
      if (minutoMs > cursor) {
        const faltantes = Math.floor((minutoMs - cursor) / 60000);
        if (faltantes > 0) {
          racha += faltantes;
          cursor += faltantes * 60000;
        }
      }
      const esInactivo = (registro.pedaleadas ?? 0) === 0 && (registro.piezas ?? 0) === 0;
      if (minutoMs >= cursor) {
        if (esInactivo) {
          racha += 1;
          cursor = minutoMs + 60000;
        } else {
          if (racha > 0) {
            segmentos.push(racha);
            racha = 0;
          }
          cursor = minutoMs + 60000;
        }
      } else if (!esInactivo && racha > 0) {
        segmentos.push(racha);
        racha = 0;
      }
    }
    if (finMs > cursor) {
      const cola = Math.ceil((finMs - cursor) / 60000);
      if (cola > 0) racha += cola;
    }
    if (racha > 0) segmentos.push(racha);
    return segmentos;
  }

  private async obtenerNptProducto(
    producto: string,
    inicio: DateTime,
    fin: DateTime,
    minutosInactividadParaNPT: number,
  ) {
    const rows = await this.registroRepo
      .createQueryBuilder('r')
      .innerJoin('r.pasoSesionTrabajo', 'stp')
      .innerJoin('r.sesionTrabajo', 'st')
      .innerJoin('stp.pasoOrden', 'p')
      .innerJoin('p.orden', 'o')
      .select('r.minutoInicio', 'minutoInicio')
      .addSelect('r.pedaleadas', 'pedaleadas')
      .addSelect('r.piezasContadas', 'piezas')
      .addSelect('p.id', 'pasoId')
      .addSelect('p.nombre', 'pasoNombre')
      .addSelect('stp.id', 'pasoSesionId')
      .where('o.producto = :producto', { producto })
      .andWhere('r.minutoInicio BETWEEN :inicio AND :fin', {
        inicio: inicio.toJSDate(),
        fin: fin.toJSDate(),
      })
      .andWhere('(st.fuente IS NULL OR st.fuente != :tabletFuente)', {
        tabletFuente: FuenteDatosSesion.TABLET,
      })
      .orderBy('p.id', 'ASC')
      .addOrderBy('stp.id', 'ASC')
      .addOrderBy('r.minutoInicio', 'ASC')
      .getRawMany<{
        minutoInicio: Date;
        pedaleadas: number;
        piezas: number;
        pasoId: string;
        pasoNombre: string;
        pasoSesionId: string;
      }>();

    if (!rows.length) {
      return {
        totalMin: 0,
        totalHoras: 0,
        totalPorInactividadMin: 0,
        pasos: [] as {
          pasoId: string;
          nombre: string;
          minutos: number;
          horas: number;
          porcentaje: number;
          nptPorInactividadMin: number;
        }[],
      };
    }

    const registrosPorSesionPaso = new Map<
      string,
      { pasoId: string; pasoNombre: string; registros: { minuto: Date; pedaleadas: number; piezas: number }[] }
    >();

    for (const row of rows) {
      const key = row.pasoSesionId;
      const entry =
        registrosPorSesionPaso.get(key) ||
        {
          pasoId: row.pasoId,
          pasoNombre: row.pasoNombre,
          registros: [],
        };
      entry.registros.push({
        minuto: row.minutoInicio,
        pedaleadas: Number(row.pedaleadas ?? 0),
        piezas: Number(row.piezas ?? 0),
      });
      registrosPorSesionPaso.set(key, entry);
    }

    const agregadoPorPaso = new Map<
      string,
      { nombre: string; nptMin: number; nptPorInactividadMin: number }
    >();

    for (const entry of registrosPorSesionPaso.values()) {
      entry.registros.sort(
        (a, b) =>
          DateTime.fromJSDate(a.minuto, { zone: this.zone }).toMillis() -
          DateTime.fromJSDate(b.minuto, { zone: this.zone }).toMillis(),
      );
      const segmentos = this.construirSegmentosInactividadProducto(entry.registros, inicio, fin);
      if (!segmentos.length) continue;
      const nptMin = segmentos.reduce((acc, v) => acc + v, 0);
      const nptPorInactividad = segmentos.reduce(
        (acc, v) => acc + (v > minutosInactividadParaNPT ? v : 0),
        0,
      );
      const agregado = agregadoPorPaso.get(entry.pasoId) || {
        nombre: entry.pasoNombre,
        nptMin: 0,
        nptPorInactividadMin: 0,
      };
      agregado.nptMin += nptMin;
      agregado.nptPorInactividadMin += nptPorInactividad;
      agregadoPorPaso.set(entry.pasoId, agregado);
    }

    const totalMin = Array.from(agregadoPorPaso.values()).reduce((acc, v) => acc + v.nptMin, 0);
    const totalPorInactividadMin = Array.from(agregadoPorPaso.values()).reduce(
      (acc, v) => acc + v.nptPorInactividadMin,
      0,
    );
    const pasos = Array.from(agregadoPorPaso.entries())
      .map(([pasoId, data]) => {
        const horas = data.nptMin / 60;
        const porcentaje = totalMin > 0 ? (data.nptMin / totalMin) * 100 : 0;
        return {
          pasoId,
          nombre: data.nombre,
          minutos: data.nptMin,
          horas: this.round(horas, 2),
          porcentaje: this.round(porcentaje, 2),
          nptPorInactividadMin: data.nptPorInactividadMin,
        };
      })
      .sort((a, b) => b.minutos - a.minutos);

    return {
      totalMin,
      totalHoras: totalMin / 60,
      totalPorInactividadMin,
      pasos,
    };
  }

  private async calcularKPIsProductoPeriodo(
    producto: string,
    inicio: DateTime,
    fin: DateTime,
    minutosInactividadParaNPT: number,
  ) {
    const [planeado, produccion, npt] = await Promise.all([
      this.obtenerPlaneadoProducto(producto, inicio, fin),
      this.obtenerProduccionProducto(producto, inicio, fin),
      this.obtenerNptProducto(producto, inicio, fin, minutosInactividadParaNPT),
    ]);

    const cumplimiento = planeado > 0 ? produccion.piezas / planeado : null;
    const totalInspeccionadas = produccion.piezas + produccion.defectos;
    const calidadPct = totalInspeccionadas > 0 ? (produccion.defectos / totalInspeccionadas) * 100 : null;

    return {
      planeado,
      piezasProducidas: produccion.piezas,
      pedaleadas: totalInspeccionadas,
      defectos: produccion.defectos,
      cumplimiento,
      calidadPct,
      npt,
    };
  }

  async indicadoresPorProducto(opts: {
    producto: string;
    periodo?: string;
    inicio?: string;
    fin?: string;
    compararCon?: string;
    compararInicio?: string;
    compararFin?: string;
    targetNc?: number | null;
    targetNpt?: number | null;
    targetCumplimiento?: number | null;
  }) {
    if (!opts.producto) throw new BadRequestException('El parámetro producto es requerido');
    const periodo = this.resolverPeriodoProducto(opts);
    const comparativo = this.resolverComparativoProducto(periodo, opts);
    const minutosInactividad = await this.configService.getMinInactividad();
    const [actual, compar] = await Promise.all([
      this.calcularKPIsProductoPeriodo(opts.producto, periodo.inicio, periodo.fin, minutosInactividad),
      comparativo
        ? this.calcularKPIsProductoPeriodo(opts.producto, comparativo.inicio, comparativo.fin, minutosInactividad)
        : Promise.resolve(null),
    ]);

    const variacionCumplimiento = compar
      ? this.variacionPorcentual(actual.cumplimiento, compar.cumplimiento)
      : null;
    const variacionCalidad = compar ? this.variacionPorcentual(actual.calidadPct, compar.calidadPct) : null;
    const variacionNpt = compar ? this.variacionPorcentual(actual.npt.totalHoras, compar.npt.totalHoras) : null;

    const indicadorCumplimiento = {
      indicador: 'cumplimiento_plan',
      periodo_actual: {
        inicio: periodo.inicio.toISO(),
        fin: periodo.fin.toISO(),
      },
      valor_actual: {
        piezas_planeadas: actual.planeado,
        piezas_producidas: actual.piezasProducidas,
        cumplimiento_rel: actual.cumplimiento != null ? this.round(actual.cumplimiento, 4) : null,
        cumplimiento_pct: actual.cumplimiento != null ? this.round(actual.cumplimiento * 100, 2) : null,
      },
      comparativo: compar && comparativo
        ? {
            inicio: comparativo.inicio.toISO(),
            fin: comparativo.fin.toISO(),
            piezas_planeadas: compar.planeado,
            piezas_producidas: compar.piezasProducidas,
            cumplimiento_rel: compar.cumplimiento != null ? this.round(compar.cumplimiento, 4) : null,
            cumplimiento_pct: compar.cumplimiento != null ? this.round(compar.cumplimiento * 100, 2) : null,
          }
        : null,
      variacion_pct: variacionCumplimiento != null ? this.round(variacionCumplimiento, 2) : null,
      objetivo: opts.targetCumplimiento ?? null,
      objetivo_pct: opts.targetCumplimiento != null ? this.round(opts.targetCumplimiento * 100, 2) : null,
      brecha_objetivo:
        opts.targetCumplimiento != null && actual.cumplimiento != null
          ? this.round(actual.cumplimiento - opts.targetCumplimiento, 4)
          : null,
      brecha_objetivo_pct:
        opts.targetCumplimiento != null && actual.cumplimiento != null
          ? this.round(actual.cumplimiento * 100 - opts.targetCumplimiento * 100, 2)
          : null,
    };

    const indicadorCalidad = {
      indicador: 'calidad_no_conforme',
      periodo_actual: {
        inicio: periodo.inicio.toISO(),
        fin: periodo.fin.toISO(),
      },
      valor_actual: {
        piezas_totales: actual.pedaleadas,
        piezas_no_conformes: actual.defectos,
        porcentaje_no_conformes: actual.calidadPct != null ? this.round(actual.calidadPct, 2) : null,
      },
      comparativo: compar && comparativo
        ? {
            inicio: comparativo.inicio.toISO(),
            fin: comparativo.fin.toISO(),
            piezas_totales: compar.pedaleadas,
            piezas_no_conformes: compar.defectos,
            porcentaje_no_conformes: compar.calidadPct != null ? this.round(compar.calidadPct, 2) : null,
          }
        : null,
      variacion_pct: variacionCalidad != null ? this.round(variacionCalidad, 2) : null,
      objetivo: opts.targetNc ?? null,
      brecha_objetivo:
        opts.targetNc != null && actual.calidadPct != null
          ? this.round(actual.calidadPct - opts.targetNc, 2)
          : null,
    };

    const indicadorNpt = {
      indicador: 'npt',
      periodo_actual: {
        inicio: periodo.inicio.toISO(),
        fin: periodo.fin.toISO(),
      },
      valor_actual: {
        total_minutos: this.round(actual.npt.totalMin, 2),
        total_horas: this.round(actual.npt.totalHoras, 2),
        npt_por_inactividad_min: this.round(actual.npt.totalPorInactividadMin, 2),
        pasos: actual.npt.pasos.map((p) => ({
          ...p,
          minutos: this.round(p.minutos, 2),
          nptPorInactividadMin: this.round(p.nptPorInactividadMin, 2),
        })),
      },
      comparativo: compar && comparativo
        ? {
            inicio: comparativo.inicio.toISO(),
            fin: comparativo.fin.toISO(),
            total_minutos: this.round(compar.npt.totalMin, 2),
            total_horas: this.round(compar.npt.totalHoras, 2),
            npt_por_inactividad_min: this.round(compar.npt.totalPorInactividadMin, 2),
            pasos: compar.npt.pasos.map((p) => ({
              ...p,
              minutos: this.round(p.minutos, 2),
              nptPorInactividadMin: this.round(p.nptPorInactividadMin, 2),
            })),
          }
        : null,
      variacion_pct: variacionNpt != null ? this.round(variacionNpt, 2) : null,
      objetivo: opts.targetNpt ?? null,
      unidad_objetivo: opts.targetNpt != null ? 'horas' : null,
      brecha_objetivo: opts.targetNpt != null ? this.round(actual.npt.totalHoras - opts.targetNpt, 2) : null,
    };

    return {
      producto: opts.producto,
      periodo: {
        inicio: periodo.inicio.toISO(),
        fin: periodo.fin.toISO(),
      },
      comparativo: compar && comparativo
        ? {
            inicio: comparativo.inicio.toISO(),
            fin: comparativo.fin.toISO(),
            tipo: (comparativo as any)?.tipo ?? 'custom',
          }
        : null,
      indicadores: [indicadorCumplimiento, indicadorCalidad, indicadorNpt],
      metadatos: {
        zonaHoraria: this.zone,
        minutosInactividadParaNPT: minutosInactividad,
      },
    };
  }

  private resolverComparativoRango(
    base: { inicio: string; fin: string },
    opts: { compararCon?: string; compararInicio?: string; compararFin?: string },
  ) {
    const inicioActual = DateTime.fromISO(base.inicio, { zone: this.zone }).startOf('day');
    const finActual = DateTime.fromISO(base.fin, { zone: this.zone }).startOf('day');
    if (!inicioActual.isValid || !finActual.isValid) return null;
    const normalizado = (opts.compararCon ?? 'previo').toLowerCase().replace(/[\s_-]/g, '');
    if (normalizado === 'ninguno' || normalizado === 'none' || normalizado === 'sincomparacion') {
      return null;
    }
    if (normalizado === 'personalizado') {
      if (!opts.compararInicio || !opts.compararFin) return null;
      const inicio = DateTime.fromISO(opts.compararInicio, { zone: this.zone }).startOf('day');
      const fin = DateTime.fromISO(opts.compararFin, { zone: this.zone }).startOf('day');
      if (!inicio.isValid || !fin.isValid) return null;
      return {
        inicio: inicio.toISODate()!,
        fin: fin.toISODate()!,
        tipo: 'personalizado' as const,
      };
    }
    if (normalizado === 'mismoperiodoanterior' || normalizado === 'mismoperiodo' || normalizado === 'anterioranio') {
      return {
        inicio: inicioActual.minus({ years: 1 }).toISODate()!,
        fin: finActual.minus({ years: 1 }).toISODate()!,
        tipo: 'mismoPeriodoAnterior' as const,
      };
    }
    const diasPeriodo = Math.max(
      1,
      Math.round(finActual.diff(inicioActual, 'days').days ?? 0) + 1,
    );
    return {
      inicio: inicioActual.minus({ days: diasPeriodo }).toISODate()!,
      fin: finActual.minus({ days: diasPeriodo }).toISODate()!,
      tipo: 'previo' as const,
    };
  }

  async listarTrabajadores(opts: {
    rango?: string
    inicio?: string
    fin?: string
    metrics?: string
    compararCon?: string
    compararInicio?: string
    compararFin?: string
  }) {
    const { inicio, fin } = this.rangoFechas({
      rango: opts.rango,
      inicio: opts.inicio,
      fin: opts.fin,
    });
    const comparativo = this.resolverComparativoRango(
      { inicio, fin },
      {
        compararCon: opts.compararCon,
        compararInicio: opts.compararInicio,
        compararFin: opts.compararFin,
      },
    );
    const fetchRows = (desde: string, hasta: string) =>
      this.repo
        .createQueryBuilder('i')
        .select('i.trabajadorId', 'id')
        .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
        .addSelect('SUM(i.defectos)', 'defectos')
        .addSelect('SUM(i.nptMin)', 'nptMin')
        .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
        .addSelect('SUM(i.pausasMin)', 'pausasMin')
        .addSelect('SUM(i.pausasCount)', 'pausasCount')
        .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
        .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
        .where('i.fecha BETWEEN :inicio AND :fin', { inicio: desde, fin: hasta })
        .andWhere('i.trabajadorId IS NOT NULL')
        .groupBy('i.trabajadorId')
        .getRawMany<{
          id: string
          produccionTotal: string | number
          defectos: string | number
          nptMin: string | number
          nptPorInactividad: string | number
          pausasMin: string | number
          pausasCount: string | number
          duracionTotalMin: string | number
          sesionesCerradas: string | number
        }>();

    const rows = await fetchRows(inicio, fin);
    const comparRows = comparativo ? await fetchRows(comparativo.inicio, comparativo.fin) : [];

    const normalizeRow = (row: {
      produccionTotal: string | number
      defectos: string | number
      nptMin: string | number
      nptPorInactividad: string | number
      pausasMin: string | number
      pausasCount: string | number
      duracionTotalMin: string | number
      sesionesCerradas: string | number
    }) => ({
      produccionTotal: this.toNum(row.produccionTotal),
      defectos: this.toNum(row.defectos),
      nptMin: this.toNum(row.nptMin),
      nptPorInactividad: this.toNum(row.nptPorInactividad),
      pausasMin: this.toNum(row.pausasMin),
      pausasCount: this.toNum(row.pausasCount),
      duracionTotalMin: this.toNum(row.duracionTotalMin),
      sesionesCerradas: this.toNum(row.sesionesCerradas),
    });

    const comparById = comparativo
      ? new Map(comparRows.map((r) => [r.id, normalizeRow(r)]))
      : new Map<string, ReturnType<typeof normalizeRow>>();

    const ids = rows.map((r) => r.id).filter(Boolean);
    const trabajadores = ids.length
      ? await this.trabajadorRepo.find({ where: { id: In(ids) } })
      : [];
    const metaById = new Map(trabajadores.map((t) => [t.id, t]));
    const metricsAllow = opts.metrics ? opts.metrics.split(',').map((s) => s.trim()).filter(Boolean) : null;
    const metricsAllowEffective = comparativo && metricsAllow
      ? Array.from(new Set([
          ...metricsAllow,
          ...metricsAllow.map((metric) => `${metric}Anterior`),
        ]))
      : metricsAllow;

    return rows.map((r) => {
      const baseInfo = {
        id: r.id,
        nombre: metaById.get(r.id)?.nombre,
        identificacion: metaById.get(r.id)?.identificacion,
        grupo: metaById.get(r.id)?.grupo,
        turno: metaById.get(r.id)?.turno,
      };
      const actualRow = normalizeRow(r);
      const actualMetrics = {
        ...this.calcMetrics({
          produccionTotal: actualRow.produccionTotal,
          defectos: actualRow.defectos,
          nptMin: actualRow.nptMin,
          nptPorInactividad: actualRow.nptPorInactividad,
          pausasMin: actualRow.pausasMin,
          duracionTotalMin: actualRow.duracionTotalMin,
          sesionesCerradas: actualRow.sesionesCerradas,
        }),
        pausasCount: actualRow.pausasCount,
      };
      const comparRow = comparativo
        ? comparById.get(r.id) ?? {
            produccionTotal: 0,
            defectos: 0,
            nptMin: 0,
            nptPorInactividad: 0,
            pausasMin: 0,
            pausasCount: 0,
            duracionTotalMin: 0,
            sesionesCerradas: 0,
          }
        : null;
      const comparMetrics = comparRow
        ? {
            ...this.calcMetrics({
              produccionTotal: comparRow.produccionTotal,
              defectos: comparRow.defectos,
              nptMin: comparRow.nptMin,
              nptPorInactividad: comparRow.nptPorInactividad,
              pausasMin: comparRow.pausasMin,
              duracionTotalMin: comparRow.duracionTotalMin,
              sesionesCerradas: comparRow.sesionesCerradas,
            }),
            pausasCount: comparRow.pausasCount,
          }
        : null;
      const comparSuffix = comparMetrics
        ? Object.fromEntries(
            Object.entries(comparMetrics).map(([key, value]) => [`${key}Anterior`, value]),
          )
        : {};
      return this.pickMetrics({
        ...baseInfo,
        ...actualMetrics,
        ...comparSuffix,
      }, metricsAllowEffective);
    });
  }

  async listarMaquinas(opts: {
    rango?: string
    inicio?: string
    fin?: string
    metrics?: string
  }) {
    const { inicio, fin } = this.rangoFechas(opts);
    const rows = await this.repo
      .createQueryBuilder('i')
      .select('i.maquinaId', 'id')
      .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.pausasCount)', 'pausasCount')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .andWhere('i.maquinaId IS NOT NULL')
      .groupBy('i.maquinaId')
      .getRawMany<{
        id: string
        produccionTotal: string | number
        defectos: string | number
        nptMin: string | number
        nptPorInactividad: string | number
        pausasMin: string | number
        pausasCount: string | number
        duracionTotalMin: string | number
        sesionesCerradas: string | number
      }>();

    const ids = rows.map((r) => r.id).filter(Boolean);
    const maquinas = ids.length
      ? await this.maquinaRepo.find({ where: { id: In(ids) }, relations: ['area'] })
      : [];
    const metaById = new Map(maquinas.map((m) => [m.id, m]));
    const metricsAllow = opts.metrics ? opts.metrics.split(',').map((s) => s.trim()).filter(Boolean) : null;

    return rows.map((r) => {
      const m = metaById.get(r.id);
      const base = {
        id: r.id,
        nombre: m?.nombre,
        tipo: m?.tipo,
        areaNombre: m?.area?.nombre,
        produccionTotal: this.toNum(r.produccionTotal),
        defectos: this.toNum(r.defectos),
        nptMin: this.toNum(r.nptMin),
        nptPorInactividad: this.toNum(r.nptPorInactividad),
        pausasMin: this.toNum(r.pausasMin),
        pausasCount: this.toNum(r.pausasCount),
        duracionTotalMin: this.toNum(r.duracionTotalMin),
        sesionesCerradas: this.toNum(r.sesionesCerradas),
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
      return this.pickMetrics({
        ...base,
        porcentajeDefectos,
        porcentajeNPT,
        porcentajePausa,
        avgSpeed,
        avgSpeedSesion,
      }, metricsAllow);
    });
  }

  async obtenerDiariaMesActual(areaId?: string) {
    const now = DateTime.now().setZone(this.zone);
    return this.obtenerDiariaRango(now.startOf('month'), now.endOf('day'), areaId);
  }

  async obtenerDiariaUltimos30Dias(areaId?: string) {
    const fin = DateTime.now().setZone(this.zone).endOf('day');
    const inicio = fin.minus({ days: 29 }).startOf('day');
    return this.obtenerDiariaRango(inicio, fin, areaId);
  }

  async obtenerMensualAnoActual(areaId?: string) {
    const now = DateTime.now().setZone(this.zone);
    return this.obtenerMensualRango(now.startOf('year'), now.endOf('day'), areaId);
  }

  async obtenerMensualUltimos12Meses(areaId?: string) {
    const fin = DateTime.now().setZone(this.zone).startOf('month');
    const inicio = fin.minus({ months: 11 }).startOf('month');
    return this.obtenerMensualRango(inicio, fin.endOf('month'), areaId);
  }

  private toNum(x: string | number | null | undefined) {
    return typeof x === 'string' ? Number(x) : x || 0;
  }

  private async obtenerDiariaRango(inicio: DateTime, fin: DateTime, areaId?: string) {
    if (areaId) {
      const rows = await this.excludeTabletFuente(
        this.repo
        .createQueryBuilder('i')
        .select('i.fecha', 'clave')
        .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
        .addSelect('SUM(i.defectos)', 'defectos')
        .addSelect('SUM(i.nptMin)', 'nptMin')
        .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
        .addSelect('SUM(i.pausasMin)', 'pausasMin')
        .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
        .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
        .where('i.fecha BETWEEN :inicio AND :fin', {
          inicio: inicio.startOf('day').toISODate(),
          fin: fin.endOf('day').toISODate(),
        })
        .andWhere('i.areaId = :areaId', { areaId })
        .groupBy('i.fecha')
        .orderBy('i.fecha', 'ASC'),
      ).getRawMany<SumRow>();

      const map = new Map(
        rows.map((r) => [
          (typeof r.clave === 'string' ? r.clave : DateTime.fromJSDate(r.clave).toISODate()) as string,
          this.calcMetrics({
            produccionTotal: this.toNum(r.produccionTotal),
            defectos: this.toNum(r.defectos),
            nptMin: this.toNum(r.nptMin),
            nptPorInactividad: this.toNum(r.nptPorInactividad),
            pausasMin: this.toNum(r.pausasMin),
            duracionTotalMin: this.toNum(r.duracionTotalMin),
            sesionesCerradas: this.toNum(r.sesionesCerradas),
          }),
        ]),
      );

      const resultado: any[] = [];
      for (let d = inicio.setZone(this.zone); d <= fin.setZone(this.zone); d = d.plus({ days: 1 })) {
        const key = d.toISODate()!;
        const base = map.get(key) || this.calcMetrics({
          produccionTotal: 0,
          defectos: 0,
          nptMin: 0,
          nptPorInactividad: 0,
          pausasMin: 0,
          duracionTotalMin: 0,
          sesionesCerradas: 0,
        });
        resultado.push({ fecha: key, areaId, ...base });
      }
      return resultado;
    }

    const rows = await this.excludeTabletFuente(
      this.repo
      .createQueryBuilder('i')
      .select('i.fecha', 'clave')
      .addSelect('i.areaId', 'areaId')
      .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.fecha BETWEEN :inicio AND :fin', {
        inicio: inicio.startOf('day').toISODate(),
        fin: fin.endOf('day').toISODate(),
      })
      .groupBy('i.fecha')
      .addGroupBy('i.areaId')
      .orderBy('i.fecha', 'ASC'),
    ).getRawMany<SumRow>();

    const byKey = new Map(
      rows.map((r) => [
        `${typeof r.clave === 'string' ? r.clave : DateTime.fromJSDate(r.clave).toISODate()}|${r.areaId}`,
        this.calcMetrics({
          produccionTotal: this.toNum(r.produccionTotal),
          defectos: this.toNum(r.defectos),
          nptMin: this.toNum(r.nptMin),
          nptPorInactividad: this.toNum(r.nptPorInactividad),
          pausasMin: this.toNum(r.pausasMin),
          duracionTotalMin: this.toNum(r.duracionTotalMin),
          sesionesCerradas: this.toNum(r.sesionesCerradas),
        }),
      ]),
    );

    const areas = await this.areaRepo.find({ select: ['id'] });
    const resultado: any[] = [];
    for (let d = inicio.setZone(this.zone); d <= fin.setZone(this.zone); d = d.plus({ days: 1 })) {
      const fechaKey = d.toISODate();
      for (const a of areas) {
        const k = `${fechaKey}|${a.id}`;
        const base = byKey.get(k) || this.calcMetrics({
          produccionTotal: 0,
          defectos: 0,
          nptMin: 0,
          nptPorInactividad: 0,
          pausasMin: 0,
          duracionTotalMin: 0,
          sesionesCerradas: 0,
        });
        resultado.push({ fecha: fechaKey, areaId: a.id, ...base });
      }
    }
    return resultado;
  }

  private async obtenerMensualRango(inicio: DateTime, fin: DateTime, areaId?: string) {
    if (areaId) {
      const rows = await this.excludeTabletFuente(
        this.repo
        .createQueryBuilder('i')
        .select("DATE_TRUNC('month', i.fecha)", 'clave')
        .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
        .addSelect('SUM(i.defectos)', 'defectos')
        .addSelect('SUM(i.nptMin)', 'nptMin')
        .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
        .addSelect('SUM(i.pausasMin)', 'pausasMin')
        .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
        .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
        .where('i.fecha BETWEEN :inicio AND :fin', {
          inicio: inicio.startOf('month').toISODate(),
          fin: fin.endOf('month').toISODate(),
        })
        .andWhere('i.areaId = :areaId', { areaId })
        .groupBy("DATE_TRUNC('month', i.fecha)")
        .orderBy('clave', 'ASC'),
      ).getRawMany<SumRow>();

      const map = new Map(
        rows.map((r) => [
          DateTime.fromJSDate(r.clave as Date).toISODate(),
          this.calcMetrics({
            produccionTotal: this.toNum(r.produccionTotal),
            defectos: this.toNum(r.defectos),
            nptMin: this.toNum(r.nptMin),
            nptPorInactividad: this.toNum(r.nptPorInactividad),
            pausasMin: this.toNum(r.pausasMin),
            duracionTotalMin: this.toNum(r.duracionTotalMin),
            sesionesCerradas: this.toNum(r.sesionesCerradas),
          }),
        ]),
      );

      const resultado: any[] = [];
      for (let m = inicio.startOf('month'); m <= fin.startOf('month'); m = m.plus({ months: 1 })) {
        const key = m.toISODate();
        const base = map.get(key) || this.calcMetrics({
          produccionTotal: 0,
          defectos: 0,
          nptMin: 0,
          nptPorInactividad: 0,
          pausasMin: 0,
          duracionTotalMin: 0,
          sesionesCerradas: 0,
        });
        resultado.push({ mes: key, areaId, ...base });
      }
      return resultado;
    }

    const rows = await this.excludeTabletFuente(
      this.repo
      .createQueryBuilder('i')
      .select("DATE_TRUNC('month', i.fecha)", 'clave')
      .addSelect('i.areaId', 'areaId')
      .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.fecha BETWEEN :inicio AND :fin', {
        inicio: inicio.startOf('month').toISODate(),
        fin: fin.endOf('month').toISODate(),
      })
      .groupBy("DATE_TRUNC('month', i.fecha)")
      .addGroupBy('i.areaId')
      .orderBy('clave', 'ASC'),
    ).getRawMany<SumRow>();

    const byKey = new Map(
      rows.map((r) => [
        `${DateTime.fromJSDate(r.clave as Date).toISODate()}|${r.areaId}`,
        this.calcMetrics({
          produccionTotal: this.toNum(r.produccionTotal),
          defectos: this.toNum(r.defectos),
          nptMin: this.toNum(r.nptMin),
          nptPorInactividad: this.toNum(r.nptPorInactividad),
          pausasMin: this.toNum(r.pausasMin),
          duracionTotalMin: this.toNum(r.duracionTotalMin),
          sesionesCerradas: this.toNum(r.sesionesCerradas),
        }),
      ]),
    );

    const areas = await this.areaRepo.find({ select: ['id'] });
    const resultado: any[] = [];
    for (let m = inicio.startOf('month'); m <= fin.startOf('month'); m = m.plus({ months: 1 })) {
      const mesKey = m.toISODate();
      for (const a of areas) {
        const k = `${mesKey}|${a.id}`;
        const base = byKey.get(k) || this.calcMetrics({
          produccionTotal: 0,
          defectos: 0,
          nptMin: 0,
          nptPorInactividad: 0,
          pausasMin: 0,
          duracionTotalMin: 0,
          sesionesCerradas: 0,
        });
        resultado.push({ mes: mesKey, areaId: a.id, ...base });
      }
    }
    return resultado;
  }

  async resumenPorDia(fecha?: string) {
    const day = fecha
      ? DateTime.fromISO(fecha, { zone: this.zone })
      : DateTime.now().setZone(this.zone);
    const rows = await this.excludeTabletFuente(
      this.repo
      .createQueryBuilder('i')
      .select('i.areaId', 'areaId')
      .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.fecha = :fecha', { fecha: day.toISODate() })
      .groupBy('i.areaId'),
    ).getRawMany<SumRow>();

    // Incluir áreas sin registros con ceros
    const areas = await this.areaRepo.find({ select: ['id'] });
    const byArea = new Map(
      rows.map((r) => [
        r.areaId as string,
        this.calcMetrics({
          produccionTotal: this.toNum(r.produccionTotal),
          defectos: this.toNum(r.defectos),
          nptMin: this.toNum(r.nptMin),
          nptPorInactividad: this.toNum(r.nptPorInactividad),
          pausasMin: this.toNum(r.pausasMin),
          duracionTotalMin: this.toNum(r.duracionTotalMin),
          sesionesCerradas: this.toNum(r.sesionesCerradas),
        }),
      ]),
    );
    return areas.map((a) => ({
      fecha: day.toISODate(),
      areaId: a.id,
      ...(byArea.get(a.id) || this.calcMetrics({
        produccionTotal: 0,
        defectos: 0,
        nptMin: 0,
        nptPorInactividad: 0,
        pausasMin: 0,
        duracionTotalMin: 0,
        sesionesCerradas: 0,
      })),
    }));
  }

  async resumenMesActual() {
    const now = DateTime.now().setZone(this.zone);
    const inicio = now.startOf('month');
    const fin = now.endOf('day');
    const rows = await this.excludeTabletFuente(
      this.repo
      .createQueryBuilder('i')
      .select('i.areaId', 'areaId')
      .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.fecha BETWEEN :inicio AND :fin', {
        inicio: inicio.toISODate(),
        fin: fin.toISODate(),
      })
      .groupBy('i.areaId'),
    ).getRawMany<SumRow>();

    const areas = await this.areaRepo.find({ select: ['id'] });
    const byArea = new Map(
      rows.map((r) => [
        r.areaId as string,
        this.calcMetrics({
          produccionTotal: this.toNum(r.produccionTotal),
          defectos: this.toNum(r.defectos),
          nptMin: this.toNum(r.nptMin),
          nptPorInactividad: this.toNum(r.nptPorInactividad),
          pausasMin: this.toNum(r.pausasMin),
          duracionTotalMin: this.toNum(r.duracionTotalMin),
          sesionesCerradas: this.toNum(r.sesionesCerradas),
        }),
      ]),
    );
    return areas.map((a) => ({
      mes: inicio.toISODate(),
      areaId: a.id,
      ...(byArea.get(a.id) || this.calcMetrics({
        produccionTotal: 0,
        defectos: 0,
        nptMin: 0,
        nptPorInactividad: 0,
        pausasMin: 0,
        duracionTotalMin: 0,
        sesionesCerradas: 0,
      })),
    }));
  }

  // ---- Series diarias por trabajador/maquina ----
  async diariaPorTrabajador(
    trabajadorId: string,
    opts: { rango?: string; inicio?: string; fin?: string },
  ) {
    const { inicio, fin } = this.rangoFechas(opts);
    const rows = await this.repo
      .createQueryBuilder('i')
      .select('i.fecha', 'fecha')
      .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.trabajadorId = :trabajadorId', { trabajadorId })
      .andWhere('i.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .groupBy('i.fecha')
      .orderBy('i.fecha', 'ASC')
      .getRawMany<{
        fecha: string | Date;
        produccionTotal: string | number;
        defectos: string | number;
        nptMin: string | number;
        nptPorInactividad: string | number;
        pausasMin: string | number;
        duracionTotalMin: string | number;
        sesionesCerradas: string | number;
      }>();

    const map = new Map(
      rows.map((r) => [
        (typeof r.fecha === 'string' ? r.fecha : DateTime.fromJSDate(r.fecha).toISODate()) as string,
        this.calcMetrics({
          produccionTotal: this.toNum(r.produccionTotal),
          defectos: this.toNum(r.defectos),
          nptMin: this.toNum(r.nptMin),
          nptPorInactividad: this.toNum(r.nptPorInactividad),
          pausasMin: this.toNum(r.pausasMin),
          duracionTotalMin: this.toNum(r.duracionTotalMin),
          sesionesCerradas: this.toNum(r.sesionesCerradas),
        }),
      ]),
    );

    const start = DateTime.fromISO(inicio, { zone: this.zone }).startOf('day');
    const end = DateTime.fromISO(fin, { zone: this.zone }).startOf('day');
    const out: any[] = [];
    for (let d = start; d <= end; d = d.plus({ days: 1 })) {
      const key = d.toISODate()!;
      const base = map.get(key) || this.calcMetrics({
        produccionTotal: 0,
        defectos: 0,
        nptMin: 0,
        nptPorInactividad: 0,
        pausasMin: 0,
        duracionTotalMin: 0,
        sesionesCerradas: 0,
      });
      out.push({ fecha: key, trabajadorId, ...base });
    }
    return out;
  }

  async diariaPorMaquina(
    maquinaId: string,
    opts: { rango?: string; inicio?: string; fin?: string },
  ) {
    const { inicio, fin } = this.rangoFechas(opts);
    const rows = await this.repo
      .createQueryBuilder('i')
      .select('i.fecha', 'fecha')
      .addSelect('SUM(i.produccionTotal)', 'produccionTotal')
      .addSelect('SUM(i.defectos)', 'defectos')
      .addSelect('SUM(i.nptMin)', 'nptMin')
      .addSelect('SUM(i.nptPorInactividad)', 'nptPorInactividad')
      .addSelect('SUM(i.pausasMin)', 'pausasMin')
      .addSelect('SUM(i.duracionTotalMin)', 'duracionTotalMin')
      .addSelect('SUM(i.sesionesCerradas)', 'sesionesCerradas')
      .where('i.maquinaId = :maquinaId', { maquinaId })
      .andWhere('i.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .groupBy('i.fecha')
      .orderBy('i.fecha', 'ASC')
      .getRawMany<{
        fecha: string | Date;
        produccionTotal: string | number;
        defectos: string | number;
        nptMin: string | number;
        nptPorInactividad: string | number;
        pausasMin: string | number;
        duracionTotalMin: string | number;
        sesionesCerradas: string | number;
      }>();

    const map = new Map(
      rows.map((r) => [
        (typeof r.fecha === 'string' ? r.fecha : DateTime.fromJSDate(r.fecha).toISODate()) as string,
        this.calcMetrics({
          produccionTotal: this.toNum(r.produccionTotal),
          defectos: this.toNum(r.defectos),
          nptMin: this.toNum(r.nptMin),
          nptPorInactividad: this.toNum(r.nptPorInactividad),
          pausasMin: this.toNum(r.pausasMin),
          duracionTotalMin: this.toNum(r.duracionTotalMin),
          sesionesCerradas: this.toNum(r.sesionesCerradas),
        }),
      ]),
    );

    const start = DateTime.fromISO(inicio, { zone: this.zone }).startOf('day');
    const end = DateTime.fromISO(fin, { zone: this.zone }).startOf('day');
    const out: any[] = [];
    for (let d = start; d <= end; d = d.plus({ days: 1 })) {
      const key = d.toISODate()!;
      const base = map.get(key) || this.calcMetrics({
        produccionTotal: 0,
        defectos: 0,
        nptMin: 0,
        nptPorInactividad: 0,
        pausasMin: 0,
        duracionTotalMin: 0,
        sesionesCerradas: 0,
      });
      out.push({ fecha: key, maquinaId, ...base });
    }
    return out;
  }
}
