import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { IndicadorDiarioDim } from '../indicador-diario-dim/indicador-diario-dim.entity';
import { Area } from '../area/area.entity';

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
  ) {}

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
      const rows = await this.repo
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
        .orderBy('i.fecha', 'ASC')
        .getRawMany<SumRow>();

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

    const rows = await this.repo
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
      .orderBy('i.fecha', 'ASC')
      .getRawMany<SumRow>();

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
      const rows = await this.repo
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
        .orderBy('clave', 'ASC')
        .getRawMany<SumRow>();

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

    const rows = await this.repo
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
      .orderBy('clave', 'ASC')
      .getRawMany<SumRow>();

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
    const rows = await this.repo
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
      .groupBy('i.areaId')
      .getRawMany<SumRow>();

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
    const rows = await this.repo
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
      .groupBy('i.areaId')
      .getRawMany<SumRow>();

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
}
