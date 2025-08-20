import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DateTime } from 'luxon';
import { IndicadorSesionMinuto } from './indicador-sesion-minuto.entity';
import { PausaPasoSesion } from '../pausa-paso-sesion/pausa-paso-sesion.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { SesionTrabajoService } from '../sesion-trabajo/sesion-trabajo.service';

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
  ) {}

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
          nptMin: indicadores.nptMin,
          nptPorInactividad: indicadores.nptPorInactividad,
          porcentajeNPT: indicadores.porcentajeNPT,
          pausasCount: count,
          pausasMin: minutos,
          porcentajePausa,
          duracionSesionMin,
          actualizadoEn: new Date(),
        },
        ['sesionTrabajo', 'minuto'],
      );
    }
  }
}
