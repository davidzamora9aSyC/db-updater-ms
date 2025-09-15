import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { DateTime } from 'luxon';
import { IndicadorSesionMinuto } from './indicador-sesion-minuto.entity';
import { PausaPasoSesion } from '../pausa-paso-sesion/pausa-paso-sesion.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { SesionTrabajoService } from '../sesion-trabajo/sesion-trabajo.service';
import { IndicadorDiarioSyncService } from '../indicador-diario-dim/indicador-diario-sync.service';

@Injectable()
export class IndicadorSesionMinutoService {
  constructor(
    @InjectRepository(IndicadorSesionMinuto)
    private readonly repo: Repository<IndicadorSesionMinuto>,
    @InjectRepository(PausaPasoSesion)
    private readonly pausaRepo: Repository<PausaPasoSesion>,
    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    private readonly sesionService: SesionTrabajoService,
    private readonly diarioSync: IndicadorDiarioSyncService,
  ) {}

  async seriePorSesion(
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
    const rows = await this.repo.find({ where, order: { minuto: 'ASC' } });
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

  @Cron('* * * * *')
  async generar() {
    const sesiones = await this.sesionRepo.find({
      where: { fechaFin: IsNull() },
      relations: ['trabajador', 'maquina', 'maquina.area'],
    });
    const minuto = DateTime.now()
      .setZone('America/Bogota')
      .startOf('minute')
      .toJSDate();
    for (const sesion of sesiones) {
      const indicadores =
        await this.sesionService.calcularIndicadoresSesion(sesion);
      const { count, minutos } = await this.obtenerPausas(sesion.id);
      const totalProduccion =
        indicadores.produccionTotal + indicadores.defectos;
      const porcentajeDefectos =
        totalProduccion > 0
          ? (indicadores.defectos / totalProduccion) * 100
          : 0;
      const duracionSesionMin = Math.round(indicadores.totalMin);
      const porcentajePausa =
        duracionSesionMin > 0 ? (minutos / duracionSesionMin) * 100 : 0;
      await this.repo.upsert(
        {
          sesionTrabajo: { id: sesion.id } as any,
          minuto,
          produccionTotal: indicadores.produccionTotal,
          defectos: indicadores.defectos,
          porcentajeDefectos,
          avgSpeed: indicadores.avgSpeed,
          avgSpeedSesion: indicadores.avgSpeedSesion,
          velocidadActual: indicadores.velocidadActual,
          nptMin: Number(indicadores.nptMin.toFixed(2)),
          nptPorInactividad: Number(
            indicadores.nptPorInactividad.toFixed(2),
          ),
          porcentajeNPT: indicadores.porcentajeNPT,
          pausasCount: count,
          pausasMin: minutos,
          porcentajePausa,
          duracionSesionMin,
          actualizadoEn: new Date(),
        },
        ['sesionTrabajo', 'minuto'],
      );

      await this.diarioSync.applyParcial(sesion, {
        produccionTotal: indicadores.produccionTotal,
        defectos: indicadores.defectos,
        nptMin: indicadores.nptMin,
        nptPorInactividad: indicadores.nptPorInactividad,
        pausasCount: count,
        pausasMin: minutos,
        duracionTotalMin: duracionSesionMin,
      });
    }

    if (DateTime.fromJSDate(minuto, { zone: 'America/Bogota' }).minute % 10 === 0) {
      await this.diarioSync.resyncOpenSessions();
    }
  }
}
