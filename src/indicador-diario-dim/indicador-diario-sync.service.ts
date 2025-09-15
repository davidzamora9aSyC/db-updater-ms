import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IndicadorDiarioDim } from './indicador-diario-dim.entity';
import { IndicadorSesion } from '../indicador-sesion/indicador-sesion.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';

type DailyKey = {
  fecha: string;
  trabajadorId: string;
  maquinaId: string;
  areaId: string | null;
};

type Totals = {
  produccionTotal: number;
  defectos: number;
  nptMin: number;
  nptPorInactividad: number;
  pausasCount: number;
  pausasMin: number;
  duracionTotalMin: number;
};

type Snapshot = DailyKey & Totals;

const zeroTotals = (): Totals => ({
  produccionTotal: 0,
  defectos: 0,
  nptMin: 0,
  nptPorInactividad: 0,
  pausasCount: 0,
  pausasMin: 0,
  duracionTotalMin: 0,
});

const addTotals = (a: Totals, b: Totals): Totals => ({
  produccionTotal: a.produccionTotal + b.produccionTotal,
  defectos: a.defectos + b.defectos,
  nptMin: a.nptMin + b.nptMin,
  nptPorInactividad: a.nptPorInactividad + b.nptPorInactividad,
  pausasCount: a.pausasCount + b.pausasCount,
  pausasMin: a.pausasMin + b.pausasMin,
  duracionTotalMin: a.duracionTotalMin + b.duracionTotalMin,
});

const diffTotals = (next: Totals, prev: Totals): Totals => ({
  produccionTotal: next.produccionTotal - prev.produccionTotal,
  defectos: next.defectos - prev.defectos,
  nptMin: next.nptMin - prev.nptMin,
  nptPorInactividad: next.nptPorInactividad - prev.nptPorInactividad,
  pausasCount: next.pausasCount - prev.pausasCount,
  pausasMin: next.pausasMin - prev.pausasMin,
  duracionTotalMin: next.duracionTotalMin - prev.duracionTotalMin,
});

const keyToString = (key: DailyKey): string =>
  `${key.fecha}|${key.trabajadorId}|${key.maquinaId}|${key.areaId ?? 'NULL'}`;

@Injectable()
export class IndicadorDiarioSyncService {
  private readonly snapshots = new Map<string, Snapshot>();

  constructor(
    @InjectRepository(IndicadorDiarioDim)
    private readonly diarioRepo: Repository<IndicadorDiarioDim>,
    @InjectRepository(IndicadorSesion)
    private readonly indicadorSesionRepo: Repository<IndicadorSesion>,
  ) {}

  async applyParcial(
    sesion: SesionTrabajo,
    totals: {
      produccionTotal: number;
      defectos: number;
      nptMin: number;
      nptPorInactividad: number;
      pausasCount: number;
      pausasMin: number;
      duracionTotalMin: number;
    },
  ): Promise<Snapshot> {
    return this.applyInternal(sesion, totals, false);
  }

  async applyFinal(
    sesion: SesionTrabajo,
    totals: {
      produccionTotal: number;
      defectos: number;
      nptMin: number;
      nptPorInactividad: number;
      pausasCount: number;
      pausasMin: number;
      duracionTotalMin: number;
    },
  ): Promise<Snapshot> {
    return this.applyInternal(sesion, totals, true);
  }

  async resyncOpenSessions(): Promise<void> {
    if (this.snapshots.size === 0) return;
    const grouped = new Map<string, { key: DailyKey; totals: Totals }>();
    for (const snap of this.snapshots.values()) {
      const key = this.pickKey(snap);
      const id = keyToString(key);
      const acc = grouped.get(id) || { key, totals: zeroTotals() };
      acc.totals = addTotals(acc.totals, pickTotals(snap));
      grouped.set(id, acc);
    }

    for (const { key, totals: openTotals } of grouped.values()) {
      const closed = await this.loadClosedTotals(key);
      const combined = addTotals(openTotals, closed);
      let diario = await this.getDiario(key);
      if (!diario) {
        diario = this.diarioRepo.create({
          ...key,
          produccionTotal: combined.produccionTotal,
          defectos: combined.defectos,
          porcentajeDefectos: 0,
          avgSpeed: 0,
          avgSpeedSesion: 0,
          nptMin: combined.nptMin,
          nptPorInactividad: combined.nptPorInactividad,
          porcentajeNPT: 0,
          pausasCount: combined.pausasCount,
          pausasMin: combined.pausasMin,
          porcentajePausa: 0,
          duracionTotalMin: combined.duracionTotalMin,
          sesionesCerradas: closed.cerradas,
          updatedAt: new Date(),
        });
      } else {
        diario.produccionTotal = combined.produccionTotal;
        diario.defectos = combined.defectos;
        diario.nptMin = combined.nptMin;
        diario.nptPorInactividad = combined.nptPorInactividad;
        diario.pausasCount = combined.pausasCount;
        diario.pausasMin = combined.pausasMin;
        diario.duracionTotalMin = combined.duracionTotalMin;
        diario.sesionesCerradas = closed.cerradas;
      }
      this.recalculate(diario);
      await this.diarioRepo.save(diario);
    }
  }

  clearSnapshot(sessionId: string) {
    this.snapshots.delete(sessionId);
  }

  private async applyInternal(
    sesion: SesionTrabajo,
    incomingTotals: {
      produccionTotal: number;
      defectos: number;
      nptMin: number;
      nptPorInactividad: number;
      pausasCount: number;
      pausasMin: number;
      duracionTotalMin: number;
    },
    finalize: boolean,
  ): Promise<Snapshot> {
    const key = this.keyFromSesion(sesion);
    const rounded: Totals = {
      produccionTotal: Math.round(incomingTotals.produccionTotal),
      defectos: Math.round(incomingTotals.defectos),
      nptMin: Math.round(incomingTotals.nptMin),
      nptPorInactividad: Math.round(incomingTotals.nptPorInactividad),
      pausasCount: Math.round(incomingTotals.pausasCount),
      pausasMin: Math.round(incomingTotals.pausasMin),
      duracionTotalMin: Math.round(incomingTotals.duracionTotalMin),
    };
    const snapshot: Snapshot = { ...key, ...rounded };
    const prev = this.snapshots.get(sesion.id);

    if (!prev) {
      await this.ensureBaseline(key, {
        excludeSessionId: sesion.id,
        excludeClosedSessionId: finalize ? sesion.id : undefined,
      });
    }

    const base = prev ? pickTotals(prev) : zeroTotals();
    const delta = diffTotals(rounded, base);
    const hasChanges = Object.values(delta).some((value) => value !== 0);

    let diario = await this.getDiario(key);
    if (!diario) {
      diario = this.diarioRepo.create({
        ...key,
        produccionTotal: 0,
        defectos: 0,
        porcentajeDefectos: 0,
        avgSpeed: 0,
        avgSpeedSesion: 0,
        nptMin: 0,
        nptPorInactividad: 0,
        porcentajeNPT: 0,
        pausasCount: 0,
        pausasMin: 0,
        porcentajePausa: 0,
        duracionTotalMin: 0,
        sesionesCerradas: 0,
        updatedAt: new Date(),
      });
    }

    if (hasChanges) {
      diario.produccionTotal += delta.produccionTotal;
      diario.defectos += delta.defectos;
      diario.nptMin += delta.nptMin;
      diario.nptPorInactividad += delta.nptPorInactividad;
      diario.pausasCount += delta.pausasCount;
      diario.pausasMin += delta.pausasMin;
      diario.duracionTotalMin += delta.duracionTotalMin;
    }

    if (finalize) {
      diario.sesionesCerradas += 1;
    }

    this.recalculate(diario);
    await this.diarioRepo.save(diario);

    if (finalize) {
      this.snapshots.delete(sesion.id);
    } else {
      this.snapshots.set(sesion.id, snapshot);
    }

    return snapshot;
  }

  private async ensureBaseline(
    key: DailyKey,
    opts: { excludeSessionId?: string; excludeClosedSessionId?: string } = {},
  ) {
    const closed = await this.loadClosedTotals(key, opts.excludeClosedSessionId);
    const open = this.sumSnapshotsForKey(key, opts.excludeSessionId);
    const combined = addTotals(open, closed);
    let diario = await this.getDiario(key);
    if (!diario) {
      diario = this.diarioRepo.create({
        ...key,
        produccionTotal: combined.produccionTotal,
        defectos: combined.defectos,
        porcentajeDefectos: 0,
        avgSpeed: 0,
        avgSpeedSesion: 0,
        nptMin: combined.nptMin,
        nptPorInactividad: combined.nptPorInactividad,
        porcentajeNPT: 0,
        pausasCount: combined.pausasCount,
        pausasMin: combined.pausasMin,
        porcentajePausa: 0,
        duracionTotalMin: combined.duracionTotalMin,
        sesionesCerradas: closed.cerradas,
        updatedAt: new Date(),
      });
    } else {
      diario.produccionTotal = combined.produccionTotal;
      diario.defectos = combined.defectos;
      diario.nptMin = combined.nptMin;
      diario.nptPorInactividad = combined.nptPorInactividad;
      diario.pausasCount = combined.pausasCount;
      diario.pausasMin = combined.pausasMin;
      diario.duracionTotalMin = combined.duracionTotalMin;
      diario.sesionesCerradas = closed.cerradas;
    }
    this.recalculate(diario);
    await this.diarioRepo.save(diario);
  }

  private async getDiario(key: DailyKey) {
    const qb = this.diarioRepo
      .createQueryBuilder('d')
      .where('d.fecha = :fecha', { fecha: key.fecha })
      .andWhere('d.trabajadorId = :trabajadorId', {
        trabajadorId: key.trabajadorId,
      })
      .andWhere('d.maquinaId = :maquinaId', { maquinaId: key.maquinaId });
    if (key.areaId) {
      qb.andWhere('d.areaId = :areaId', { areaId: key.areaId });
    } else {
      qb.andWhere('d.areaId IS NULL');
    }
    return qb.getOne();
  }

  private sumSnapshotsForKey(key: DailyKey, excludeSessionId?: string): Totals {
    const total = zeroTotals();
    for (const [sessionId, snap] of this.snapshots.entries()) {
      if (sessionId === excludeSessionId) continue;
      if (!this.sameKey(snap, key)) continue;
      total.produccionTotal += snap.produccionTotal;
      total.defectos += snap.defectos;
      total.nptMin += snap.nptMin;
      total.nptPorInactividad += snap.nptPorInactividad;
      total.pausasCount += snap.pausasCount;
      total.pausasMin += snap.pausasMin;
      total.duracionTotalMin += snap.duracionTotalMin;
    }
    return total;
  }

  private recalculate(entity: IndicadorDiarioDim) {
    const totalPedaleos = entity.produccionTotal + entity.defectos;
    entity.porcentajeDefectos =
      totalPedaleos > 0 ? (entity.defectos / totalPedaleos) * 100 : 0;
    const cappedNpt = Math.min(entity.nptMin, entity.duracionTotalMin);
    entity.porcentajeNPT =
      entity.duracionTotalMin > 0
        ? (cappedNpt / entity.duracionTotalMin) * 100
        : 0;
    entity.porcentajePausa =
      entity.duracionTotalMin > 0
        ? (entity.pausasMin / entity.duracionTotalMin) * 100
        : 0;
    const minProd = Math.max(
      Number.EPSILON,
      entity.duracionTotalMin - Math.min(entity.duracionTotalMin, entity.nptMin),
    );
    entity.avgSpeed = (entity.produccionTotal / minProd) * 60;
    entity.avgSpeedSesion =
      entity.duracionTotalMin > 0
        ? (entity.produccionTotal / entity.duracionTotalMin) * 60
        : 0;
    entity.updatedAt = new Date();
  }

  private sameKey(a: DailyKey, b: DailyKey) {
    return (
      a.fecha === b.fecha &&
      a.trabajadorId === b.trabajadorId &&
      a.maquinaId === b.maquinaId &&
      (a.areaId ?? null) === (b.areaId ?? null)
    );
  }

  private pickKey(snap: Snapshot): DailyKey {
    return {
      fecha: snap.fecha,
      trabajadorId: snap.trabajadorId,
      maquinaId: snap.maquinaId,
      areaId: snap.areaId,
    };
  }

  private keyFromSesion(sesion: SesionTrabajo): DailyKey {
    const areaId = sesion.areaIdSnapshot ?? sesion.maquina?.area?.id ?? null;
    return {
      fecha: this.toISODate(sesion.fechaInicio),
      trabajadorId: sesion.trabajador.id,
      maquinaId: sesion.maquina.id,
      areaId,
    };
  }

  private toISODate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  private async loadClosedTotals(
    key: DailyKey,
    excludeSesionId?: string,
  ): Promise<Totals & { cerradas: number }> {
    let qb = this.indicadorSesionRepo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.produccionTotal),0)', 'produccionTotal')
      .addSelect('COALESCE(SUM(s.defectos),0)', 'defectos')
      .addSelect('COALESCE(SUM(s.nptMin),0)', 'nptMin')
      .addSelect('COALESCE(SUM(s.nptPorInactividad),0)', 'nptPorInactividad')
      .addSelect('COALESCE(SUM(s.pausasCount),0)', 'pausasCount')
      .addSelect('COALESCE(SUM(s.pausasMin),0)', 'pausasMin')
      .addSelect('COALESCE(SUM(s.duracionSesionMin),0)', 'duracionTotalMin')
      .addSelect('COUNT(*)', 'cerradas')
      .where(
        "s.fechaInicio >= :fecha::date AND s.fechaInicio < (:fecha::date + interval '1 day')",
        { fecha: key.fecha },
      )
      .andWhere('s.trabajadorId = :trabajadorId', {
        trabajadorId: key.trabajadorId,
      })
      .andWhere('s.maquinaId = :maquinaId', { maquinaId: key.maquinaId });

    if (key.areaId) {
      qb = qb.andWhere('s.areaIdSnapshot = :areaId', { areaId: key.areaId });
    } else {
      qb = qb.andWhere('s.areaIdSnapshot IS NULL');
    }

    if (excludeSesionId) {
      qb = qb.andWhere('s.sesionTrabajoId != :sesionId', {
        sesionId: excludeSesionId,
      });
    }

    const raw = await qb.getRawOne<{
      produccionTotal: string;
      defectos: string;
      nptMin: string;
      nptPorInactividad: string;
      pausasCount: string;
      pausasMin: string;
      duracionTotalMin: string;
      cerradas: string;
    }>();

    return {
      produccionTotal: Number(raw?.produccionTotal || 0),
      defectos: Number(raw?.defectos || 0),
      nptMin: Number(raw?.nptMin || 0),
      nptPorInactividad: Number(raw?.nptPorInactividad || 0),
      pausasCount: Number(raw?.pausasCount || 0),
      pausasMin: Number(raw?.pausasMin || 0),
      duracionTotalMin: Number(raw?.duracionTotalMin || 0),
      cerradas: Number(raw?.cerradas || 0),
    };
  }
}

function pickTotals(source: Snapshot): Totals {
  return {
    produccionTotal: source.produccionTotal,
    defectos: source.defectos,
    nptMin: source.nptMin,
    nptPorInactividad: source.nptPorInactividad,
    pausasCount: source.pausasCount,
    pausasMin: source.pausasMin,
    duracionTotalMin: source.duracionTotalMin,
  };
}
