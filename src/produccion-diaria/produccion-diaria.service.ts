import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { ProduccionDiaria } from './produccion-diaria.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { RegistroMinuto } from '../registro-minuto/registro-minuto.entity';
import { Area } from '../area/area.entity';

@Injectable()
export class ProduccionDiariaService {
  private readonly zone = 'America/Bogota';

  constructor(
    @InjectRepository(ProduccionDiaria)
    private readonly repo: Repository<ProduccionDiaria>,

    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    @InjectRepository(RegistroMinuto)
    private readonly registroRepo: Repository<RegistroMinuto>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
  ) {}

  async actualizarProduccionPorSesionCerrada(sesionId: string) {
    const sesion = await this.sesionRepo.findOne({
      where: { id: sesionId },
      relations: ['maquina', 'maquina.area'],
    });
    if (!sesion || !sesion.fechaFin || sesion.agregadoEnProduccion) return;

    const registros = await this.registroRepo.find({
      where: { sesionTrabajo: { id: sesionId } },
      select: ['minutoInicio', 'piezasContadas', 'pedaleadas'],
    });
    const acumulado = new Map<string, { piezas: number; pedaleadas: number }>();
    for (const r of registros) {
      const fechaStr = DateTime.fromJSDate(r.minutoInicio, {
        zone: this.zone,
      }).toISODate();
      if (!fechaStr) continue;
      const tot = acumulado.get(fechaStr) || { piezas: 0, pedaleadas: 0 };
      tot.piezas += r.piezasContadas;
      tot.pedaleadas += r.pedaleadas;
      acumulado.set(fechaStr, tot);
    }
    const areaId = sesion.maquina.area.id;
    for (const [fecha, tot] of acumulado) {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(ProduccionDiaria)
        .values({
          fecha: DateTime.fromISO(fecha, { zone: this.zone }).toJSDate(),
          areaId,
          piezas: tot.piezas,
          pedaleadas: tot.pedaleadas,
          sesionesCerradas: 1,
        })
        .onConflict(
          '("fecha","areaId") DO UPDATE SET "piezas" = "produccion_diaria"."piezas" + EXCLUDED."piezas", "pedaleadas" = "produccion_diaria"."pedaleadas" + EXCLUDED."pedaleadas", "sesionesCerradas" = "produccion_diaria"."sesionesCerradas" + EXCLUDED."sesionesCerradas"',
        )
        .execute();
    }
    sesion.agregadoEnProduccion = true;
    await this.sesionRepo.save(sesion);
  }


  async obtenerProduccionDiariaMesActual(areaId?: string) {
    const now = DateTime.now().setZone(this.zone);
    const inicio = now.startOf('month');
    const fin = now.endOf('day');
    return this.obtenerDiariaRango(inicio, fin, areaId);
  }

  async obtenerProduccionDiariaUltimos30Dias(areaId?: string) {
    const fin = DateTime.now().setZone(this.zone).endOf('day');
    const inicio = fin.minus({ days: 29 });
    return this.obtenerDiariaRango(inicio, fin, areaId);
  }

  async obtenerProduccionMensualAnoActual(areaId?: string) {
    const now = DateTime.now().setZone(this.zone);
    const inicio = now.startOf('year');
    const fin = now.endOf('day');
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
    if (areaId) {
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
        .andWhere('p.areaId = :areaId', { areaId })
        .groupBy('p.fecha')
        .orderBy('p.fecha', 'ASC');

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

      const resultado: any[] = [];
      for (let d = inicio; d <= fin; d = d.plus({ days: 1 })) {
        const key = d.toISODate();
        const totales = map.get(key) || {
          piezas: 0,
          pedaleadas: 0,
          sesionesCerradas: 0,
        };
        resultado.push({ fecha: key, areaId, ...totales });
      }
      return resultado;
    }

    const qb = this.repo
      .createQueryBuilder('p')
      .select('p.fecha', 'fecha')
      .addSelect('p.areaId', 'areaId')
      .addSelect('SUM(p.piezas)', 'piezas')
      .addSelect('SUM(p.pedaleadas)', 'pedaleadas')
      .addSelect('SUM(p.sesionesCerradas)', 'sesionesCerradas')
      .where('p.fecha BETWEEN :inicio AND :fin', {
        inicio: inicio.toISODate(),
        fin: fin.toISODate(),
      })
      .groupBy('p.fecha')
      .addGroupBy('p.areaId')
      .orderBy('p.fecha', 'ASC');

    const rows = await qb.getRawMany();
    const byKey = new Map(
      rows.map((r) => [
        `${r.fecha}|${r.areaId}`,
        {
          piezas: Number(r.piezas) || 0,
          pedaleadas: Number(r.pedaleadas) || 0,
          sesionesCerradas: Number(r.sesionesCerradas) || 0,
        },
      ]),
    );

    const areas = await this.areaRepo.find({ select: ['id'] });
    const resultado: any[] = [];
    for (let d = inicio; d <= fin; d = d.plus({ days: 1 })) {
      const fechaKey = d.toISODate();
      for (const a of areas) {
        const k = `${fechaKey}|${a.id}`;
        const totales = byKey.get(k) || {
          piezas: 0,
          pedaleadas: 0,
          sesionesCerradas: 0,
        };
        resultado.push({ fecha: fechaKey, areaId: a.id, ...totales });
      }
    }
    return resultado;
  }

  private async obtenerMensualRango(
    inicio: DateTime,
    fin: DateTime,
    areaId?: string,
  ) {
    if (areaId) {
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
        .andWhere('p.areaId = :areaId', { areaId })
        .groupBy("DATE_TRUNC('month', p.fecha)")
        .orderBy('mes', 'ASC');

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

      const resultado: any[] = [];
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
        resultado.push({ mes: key, areaId, ...totales });
      }
      return resultado;
    }

    const qb = this.repo
      .createQueryBuilder('p')
      .select("DATE_TRUNC('month', p.fecha)", 'mes')
      .addSelect('p.areaId', 'areaId')
      .addSelect('SUM(p.piezas)', 'piezas')
      .addSelect('SUM(p.pedaleadas)', 'pedaleadas')
      .addSelect('SUM(p.sesionesCerradas)', 'sesionesCerradas')
      .where('p.fecha BETWEEN :inicio AND :fin', {
        inicio: inicio.toISODate(),
        fin: fin.toISODate(),
      })
      .groupBy("DATE_TRUNC('month', p.fecha)")
      .addGroupBy('p.areaId')
      .orderBy('mes', 'ASC');

    const rows = await qb.getRawMany();
    const byKey = new Map(
      rows.map((r) => [
        `${DateTime.fromJSDate(r.mes).toISODate()}|${r.areaId}`,
        {
          piezas: Number(r.piezas) || 0,
          pedaleadas: Number(r.pedaleadas) || 0,
          sesionesCerradas: Number(r.sesionesCerradas) || 0,
        },
      ]),
    );

    const areas = await this.areaRepo.find({ select: ['id'] });
    const resultado: any[] = [];
    for (
      let m = inicio.startOf('month');
      m <= fin.startOf('month');
      m = m.plus({ months: 1 })
    ) {
      const mesKey = m.toISODate();
      for (const a of areas) {
        const k = `${mesKey}|${a.id}`;
        const totales = byKey.get(k) || {
          piezas: 0,
          pedaleadas: 0,
          sesionesCerradas: 0,
        };
        resultado.push({ mes: mesKey, areaId: a.id, ...totales });
      }
    }
    return resultado;
  }
}
