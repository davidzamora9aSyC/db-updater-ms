import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { ProduccionDiaria } from './produccion-diaria.entity';

@Injectable()
export class ProduccionDiariaService {
  private readonly zone = 'America/Bogota';

  constructor(
    @InjectRepository(ProduccionDiaria)
    private readonly repo: Repository<ProduccionDiaria>,
  ) {}

  async obtenerProduccionDiariaMesActual(areaId?: string) {
    const now = DateTime.now().setZone(this.zone);
    const inicio = now.startOf('month');
    const fin = now.endOf('month');
    return this.obtenerDiariaRango(inicio, fin, areaId);
  }

  async obtenerProduccionDiariaUltimos30Dias(areaId?: string) {
    const fin = DateTime.now().setZone(this.zone).startOf('day');
    const inicio = fin.minus({ days: 29 });
    return this.obtenerDiariaRango(inicio, fin, areaId);
  }

  async obtenerProduccionMensualAnoActual(areaId?: string) {
    const now = DateTime.now().setZone(this.zone);
    const inicio = now.startOf('year');
    const fin = now.endOf('year');
    return this.obtenerMensualRango(inicio, fin, areaId);
  }

  async obtenerProduccionMensualUltimos12Meses(areaId?: string) {
    const fin = DateTime.now().setZone(this.zone).startOf('month');
    const inicio = fin.minus({ months: 11 });
    const finMes = fin.endOf('month');
    return this.obtenerMensualRango(inicio, finMes, areaId);
  }

  private async obtenerDiariaRango(
    inicio: DateTime,
    fin: DateTime,
    areaId?: string,
  ) {
    const qb = this.repo
      .createQueryBuilder('p')
      .select('p.fecha', 'fecha')
      .addSelect('SUM(p.piezas)', 'piezas')
      .addSelect('SUM(p.pedaleadas)', 'pedaleadas')
      .addSelect('SUM(p.sesionesCerradas)', 'sesionesCerradas')
      .where('p.fecha BETWEEN :inicio AND :fin', {
        inicio: inicio.toISODate(),
        fin: fin.toISODate(),
      })
      .groupBy('p.fecha')
      .orderBy('p.fecha', 'ASC');
    if (areaId) qb.andWhere('p.areaId = :areaId', { areaId });
    const rows = await qb.getRawMany();
    const map = new Map(
      rows.map((r) => [
        r.fecha,
        {
          piezas: Number(r.piezas) || 0,
          pedaleadas: Number(r.pedaleadas) || 0,
          sesionesCerradas: Number(r.sesionesCerradas) || 0,
        },
      ]),
    );
    const resultado = [];
    for (let d = inicio; d <= fin; d = d.plus({ days: 1 })) {
      const key = d.toISODate();
      const totales = map.get(key) || {
        piezas: 0,
        pedaleadas: 0,
        sesionesCerradas: 0,
      };
      resultado.push({ fecha: key, areaId: areaId ?? null, ...totales });
    }
    return resultado;
  }

  private async obtenerMensualRango(
    inicio: DateTime,
    fin: DateTime,
    areaId?: string,
  ) {
    const qb = this.repo
      .createQueryBuilder('p')
      .select("DATE_TRUNC('month', p.fecha)", 'mes')
      .addSelect('SUM(p.piezas)', 'piezas')
      .addSelect('SUM(p.pedaleadas)', 'pedaleadas')
      .addSelect('SUM(p.sesionesCerradas)', 'sesionesCerradas')
      .where('p.fecha BETWEEN :inicio AND :fin', {
        inicio: inicio.toISODate(),
        fin: fin.toISODate(),
      })
      .groupBy("DATE_TRUNC('month', p.fecha)")
      .orderBy('mes', 'ASC');
    if (areaId) qb.andWhere('p.areaId = :areaId', { areaId });
    const rows = await qb.getRawMany();
    const map = new Map(
      rows.map((r) => [
        DateTime.fromJSDate(r.mes).toISODate(),
        {
          piezas: Number(r.piezas) || 0,
          pedaleadas: Number(r.pedaleadas) || 0,
          sesionesCerradas: Number(r.sesionesCerradas) || 0,
        },
      ]),
    );
    const resultado = [];
    for (
      let m = inicio.startOf('month');
      m <= fin.startOf('month');
      m = m.plus({ months: 1 })
    ) {
      const key = m.toISODate();
      const totales = map.get(key) || {
        piezas: 0,
        pedaleadas: 0,
        sesionesCerradas: 0,
      };
      resultado.push({ mes: key, areaId: areaId ?? null, ...totales });
    }
    return resultado;
  }
}
