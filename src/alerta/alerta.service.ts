import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Alerta } from './alerta.entity';
import { AlertaTipo, AlertaTipoCodigo } from './alerta-tipo.entity';
import { PausaPasoSesion } from '../pausa-paso-sesion/pausa-paso-sesion.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { Trabajador } from '../trabajador/trabajador.entity';
import { Maquina } from '../maquina/maquina.entity';
import { AlertaSujetoTipo } from './alerta.entity';
import { RegistroMinuto } from '../registro-minuto/registro-minuto.entity';
import { ConfiguracionService } from '../configuracion/configuracion.service';

export interface GetAlertasQuery {
  fecha?: string; // YYYY-MM-DD
  trabajadorId?: string;
  identificacion?: string;
}

export interface GetAlertasTrabajadorRangoQuery {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  trabajadorId?: string;
  identificacion?: string;
}

export interface GetAlertasMaquinaRangoQuery {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  maquinaId?: string; // UUID
  maquina?: string; // id/código/nombre
}

@Injectable()
export class AlertaService implements OnModuleInit {
  constructor(
    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,
    @InjectRepository(AlertaTipo)
    private readonly tipoRepo: Repository<AlertaTipo>,
    @InjectRepository(PausaPasoSesion)
    private readonly pausaRepo: Repository<PausaPasoSesion>,
    @InjectRepository(SesionTrabajoPaso)
    private readonly stpRepo: Repository<SesionTrabajoPaso>,
    @InjectRepository(SesionTrabajo)
    private readonly stRepo: Repository<SesionTrabajo>,
    @InjectRepository(Trabajador)
    private readonly trabajadorRepo: Repository<Trabajador>,
    @InjectRepository(RegistroMinuto)
    private readonly registroRepo: Repository<RegistroMinuto>,
    @InjectRepository(Maquina)
    private readonly maquinaRepo: Repository<Maquina>,
    private readonly configService: ConfiguracionService,
  ) {}

  async onModuleInit() {
    // Garantizar tipos base
    const base: { codigo: AlertaTipoCodigo; nombre: string; descripcion: string }[] = [
      {
        codigo: AlertaTipoCodigo.TRABAJADOR_DEMASIADOS_DESCANSOS_EN_DIA,
        nombre: 'Demasiados descansos en el día',
        descripcion:
          'El trabajador superó el límite de descansos permitidos en el día.',
      },
      {
        codigo: AlertaTipoCodigo.TRABAJADOR_PAUSA_LARGA,
        nombre: 'Pausa prolongada',
        descripcion: 'El trabajador tiene una pausa cuya duración supera el límite.',
      },
      { codigo: AlertaTipoCodigo.SIN_ACTIVIDAD, nombre: 'Sin actividad', descripcion: 'Sesión sin producción ni pedaleos por más de X minutos.' },
    ];
    const existentes = await this.tipoRepo.find();
    const faltantes = base.filter((b) => !existentes.some((e) => e.codigo === b.codigo));
    if (faltantes.length) {
      await this.tipoRepo.save(faltantes.map((f) => this.tipoRepo.create(f)));
    }
  }

  async getTipos(): Promise<AlertaTipo[]> {
    return this.tipoRepo.find();
  }

  async getAlertas(query: GetAlertasQuery) {
    const fecha = query.fecha ?? new Date().toISOString().slice(0, 10);
    const trabajadorId = query.trabajadorId?.trim();
    const identificacion = query.identificacion?.trim();
    const hoy = new Date().toISOString().slice(0, 10);
    const maxDescansos = await this.configService.getMaxDescansosDiariosPorTrabajador();
    const maxPausaMin = await this.configService.getMaxDuracionPausaMinutos();
    const minInactividad = await this.configService.getMinInactividad();

    const resultados: any[] = [];

    // Tipos
    const tipoDescansos = await this.tipoRepo.findOneBy({
      codigo: AlertaTipoCodigo.TRABAJADOR_DEMASIADOS_DESCANSOS_EN_DIA,
    });
    const tipoPausaLarga = await this.tipoRepo.findOneBy({
      codigo: AlertaTipoCodigo.TRABAJADOR_PAUSA_LARGA,
    });
    const tipoSinActividad = await this.tipoRepo.findOneBy({
      codigo: AlertaTipoCodigo.SIN_ACTIVIDAD,
    });

    // Mapa de trabajadores helper
    const ensureTrabajadores = async (ids: string[]) => {
      if (!ids.length) return new Map<string, Trabajador>();
      const list = await this.trabajadorRepo.findBy({ id: In(ids) });
      return new Map(list.map((t) => [t.id, t]));
    };

    // Helper para aplicar filtro por trabajador (id o identificación)
    const applyTrabFilter = <T>(qb: T & { andWhere: any }) => {
      if (trabajadorId) return qb.andWhere('t.id = :trabajadorId', { trabajadorId });
      if (identificacion) return qb.andWhere('t.identificacion = :identificacion', { identificacion });
      return qb;
    };

    // 1) Demasiados descansos por día por trabajador
    let qbDesc = this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'stp')
      .innerJoin('stp.sesionTrabajo', 'st')
      .innerJoin('st.trabajador', 't')
      .select('t.id', 'trabajadorId')
      .addSelect("TO_CHAR(p.inicio, 'YYYY-MM-DD')", 'fecha')
      .addSelect('COUNT(p.id)', 'total')
      .where("TO_CHAR(p.inicio, 'YYYY-MM-DD') = :fecha", { fecha })
      .groupBy('t.id')
      .addGroupBy("TO_CHAR(p.inicio, 'YYYY-MM-DD')")
      .having('COUNT(p.id) > :limite', { limite: maxDescansos });
    qbDesc = applyTrabFilter(qbDesc);
    const rowsDescansos: { trabajadorId: string; fecha: string; total: string }[] = await qbDesc.getRawMany();
    const mapTrab1 = await ensureTrabajadores(rowsDescansos.map((r) => r.trabajadorId));
    resultados.push(
      ...rowsDescansos.map((r) => ({
        id: undefined,
        tipo: tipoDescansos!,
        sujeto: {
          tipo: AlertaSujetoTipo.TRABAJADOR,
          id: r.trabajadorId,
          nombre: mapTrab1.get(r.trabajadorId)?.nombre ?? '',
        },
        fecha: r.fecha,
        metadata: { total: Number(r.total), limite: maxDescansos },
      })),
    );

    // 2) Pausa prolongada (cerrada u abierta) en el día
    let qbPausaC = this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'stp')
      .innerJoin('stp.sesionTrabajo', 'st')
      .innerJoin('st.trabajador', 't')
      .select('p.id', 'id')
      .addSelect('t.id', 'trabajadorId')
      .addSelect("TO_CHAR(p.inicio, 'YYYY-MM-DD')", 'fecha')
      .addSelect("EXTRACT(EPOCH FROM (p.fin - p.inicio))/60", 'duracion')
      .where('p.fin IS NOT NULL')
      .andWhere("TO_CHAR(p.inicio, 'YYYY-MM-DD') = :fecha", { fecha })
      .andWhere('EXTRACT(EPOCH FROM (p.fin - p.inicio))/60 > :lim', { lim: maxPausaMin });
    qbPausaC = applyTrabFilter(qbPausaC);
    const rowsPausaCerrada: { id: string; trabajadorId: string; fecha: string; duracion: number }[] = await qbPausaC.getRawMany();

    let qbPausaA = this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'stp')
      .innerJoin('stp.sesionTrabajo', 'st')
      .innerJoin('st.trabajador', 't')
      .select('p.id', 'id')
      .addSelect('t.id', 'trabajadorId')
      .addSelect("TO_CHAR(p.inicio, 'YYYY-MM-DD')", 'fecha')
      .addSelect("EXTRACT(EPOCH FROM (NOW() - p.inicio))/60", 'duracion')
      .where('p.fin IS NULL')
      .andWhere("TO_CHAR(p.inicio, 'YYYY-MM-DD') = :fecha", { fecha })
      .andWhere('EXTRACT(EPOCH FROM (NOW() - p.inicio))/60 > :lim', { lim: maxPausaMin });
    qbPausaA = applyTrabFilter(qbPausaA);
    const rowsPausaAbierta: { id: string; trabajadorId: string; fecha: string; duracion: number }[] = await qbPausaA.getRawMany();

    const mapTrab2 = await ensureTrabajadores([
      ...rowsPausaCerrada.map((r) => r.trabajadorId),
      ...rowsPausaAbierta.map((r) => r.trabajadorId),
    ]);
    resultados.push(
      ...rowsPausaCerrada.map((r) => ({
        id: undefined,
        tipo: tipoPausaLarga!,
        sujeto: {
          tipo: AlertaSujetoTipo.TRABAJADOR,
          id: r.trabajadorId,
          nombre: mapTrab2.get(r.trabajadorId)?.nombre ?? '',
        },
        fecha: r.fecha,
        metadata: { pausaId: r.id, duracionMin: Math.round(Number(r.duracion)), abierta: false, limite: maxPausaMin },
      })),
      ...rowsPausaAbierta.map((r) => ({
        id: undefined,
        tipo: tipoPausaLarga!,
        sujeto: {
          tipo: AlertaSujetoTipo.TRABAJADOR,
          id: r.trabajadorId,
          nombre: mapTrab2.get(r.trabajadorId)?.nombre ?? '',
        },
        fecha: r.fecha,
        metadata: { pausaId: r.id, duracionMin: Math.round(Number(r.duracion)), abierta: true, limite: maxPausaMin },
      })),
    );

    // 3) Sin actividad: sesiones sin producción/pedaleos por X minutos
    // Referencia de tiempo: now() si fecha=hoy; fin del día si es otra fecha
    const refTimeExpr = fecha === hoy ? 'NOW()' : `TO_TIMESTAMP(:fecha || ' 23:59:59', 'YYYY-MM-DD HH24:MI:SS')`;
    let qbInact = this.stRepo
      .createQueryBuilder('st')
      .innerJoin('st.trabajador', 't')
      .leftJoin(
        (qb) =>
          qb
            .select('r.sesionTrabajoId', 'sesion_id')
            .addSelect('MAX(r.minutoInicio)', 'last_min')
            .from(RegistroMinuto, 'r')
            .where("(r.pedaleadas > 0 OR r.piezasContadas > 0)")
            .andWhere("TO_CHAR(r.minutoInicio, 'YYYY-MM-DD') = :fecha", { fecha })
            .groupBy('r.sesionTrabajoId'),
        'lr',
        'lr.sesion_id = st.id',
      )
      .where("TO_CHAR(st.fechaInicio, 'YYYY-MM-DD') = :fecha", { fecha })
      .andWhere('st.fechaFin IS NULL')
      .select('st.id', 'sesionId')
      .addSelect('t.id', 'trabajadorId')
      .addSelect(`EXTRACT(EPOCH FROM ( ${refTimeExpr} - COALESCE(lr.last_min, st.fechaInicio) ))/60`, 'minutos')
      .andWhere('EXTRACT(EPOCH FROM ( ' + refTimeExpr + ' - COALESCE(lr.last_min, st.fechaInicio) ))/60 > :lim', {
        lim: minInactividad,
      });
    qbInact = applyTrabFilter(qbInact);
    const rowsInact: { sesionId: string; trabajadorId: string; minutos: number }[] = await qbInact.getRawMany();

    const mapTrab3 = await ensureTrabajadores(rowsInact.map((r) => r.trabajadorId));
    resultados.push(
      ...rowsInact.map((r) => ({
        id: undefined,
        tipo: tipoSinActividad!,
        sujeto: {
          tipo: AlertaSujetoTipo.TRABAJADOR,
          id: r.trabajadorId,
          nombre: mapTrab3.get(r.trabajadorId)?.nombre ?? '',
        },
        fecha,
        metadata: {
          sesionId: r.sesionId,
          minutosSinActividad: Math.round(Number(r.minutos)),
          limite: minInactividad,
          motivo: 'SIN_ACTIVIDAD',
        },
      })),
    );

    return resultados;
  }

  // Alertas por trabajador en rango (sin iterar día a día)
  async getAlertasTrabajadorRango(query: GetAlertasTrabajadorRangoQuery) {
    const desde = (query.desde || '').slice(0, 10);
    const hasta = (query.hasta || '').slice(0, 10);
    if (!desde || !hasta) {
      throw new Error('Parámetros desde y hasta son requeridos (YYYY-MM-DD).');
    }

    const maxDescansos = await this.configService.getMaxDescansosDiariosPorTrabajador();
    const maxPausaMin = await this.configService.getMaxDuracionPausaMinutos();
    const minInactividad = await this.configService.getMinInactividad();

    const trabajadorId = query.trabajadorId?.trim();
    const identificacion = query.identificacion?.trim();

    // Helper: filtro por trabajador
    const applyTrabFilterRaw = (base: string) => {
      if (trabajadorId) return base + ' AND t.id = :trabajadorId';
      if (identificacion) return base + ' AND t.identificacion = :identificacion';
      return base;
    };

    // 1) Demasiados descansos agrupados por día dentro del rango
    let qbDesc = this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'stp')
      .innerJoin('stp.sesionTrabajo', 'st')
      .innerJoin('st.trabajador', 't')
      .select('t.id', 'trabajadorId')
      .addSelect("TO_CHAR(p.inicio, 'YYYY-MM-DD')", 'fecha')
      .addSelect('COUNT(p.id)', 'total')
      .where("p.inicio::date BETWEEN :desde::date AND :hasta::date", { desde, hasta })
      .groupBy('t.id')
      .addGroupBy("TO_CHAR(p.inicio, 'YYYY-MM-DD')")
      .having('COUNT(p.id) > :limite', { limite: maxDescansos });
    if (trabajadorId) qbDesc = qbDesc.andWhere('t.id = :trabajadorId', { trabajadorId });
    else if (identificacion) qbDesc = qbDesc.andWhere('t.identificacion = :identificacion', { identificacion });
    const rowsDescansos: { trabajadorId: string; fecha: string; total: string }[] = await qbDesc.getRawMany();

    // 2) Pausas prolongadas (cerradas) en rango
    let qbPausaC = this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'stp')
      .innerJoin('stp.sesionTrabajo', 'st')
      .innerJoin('st.trabajador', 't')
      .select('p.id', 'id')
      .addSelect('t.id', 'trabajadorId')
      .addSelect("TO_CHAR(p.inicio, 'YYYY-MM-DD')", 'fecha')
      .addSelect("EXTRACT(EPOCH FROM (p.fin - p.inicio))/60", 'duracion')
      .where('p.fin IS NOT NULL')
      .andWhere("p.inicio::date BETWEEN :desde::date AND :hasta::date", { desde, hasta })
      .andWhere('EXTRACT(EPOCH FROM (p.fin - p.inicio))/60 > :lim', { lim: maxPausaMin });
    if (trabajadorId) qbPausaC = qbPausaC.andWhere('t.id = :trabajadorId', { trabajadorId });
    else if (identificacion) qbPausaC = qbPausaC.andWhere('t.identificacion = :identificacion', { identificacion });
    const rowsPausaCerrada: { id: string; trabajadorId: string; fecha: string; duracion: number }[] = await qbPausaC.getRawMany();

    // 2b) Pausas prolongadas (abiertas) en rango
    let qbPausaA = this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'stp')
      .innerJoin('stp.sesionTrabajo', 'st')
      .innerJoin('st.trabajador', 't')
      .select('p.id', 'id')
      .addSelect('t.id', 'trabajadorId')
      .addSelect("TO_CHAR(p.inicio, 'YYYY-MM-DD')", 'fecha')
      .addSelect("EXTRACT(EPOCH FROM (NOW() - p.inicio))/60", 'duracion')
      .where('p.fin IS NULL')
      .andWhere("p.inicio::date BETWEEN :desde::date AND :hasta::date", { desde, hasta })
      .andWhere('EXTRACT(EPOCH FROM (NOW() - p.inicio))/60 > :lim', { lim: maxPausaMin });
    if (trabajadorId) qbPausaA = qbPausaA.andWhere('t.id = :trabajadorId', { trabajadorId });
    else if (identificacion) qbPausaA = qbPausaA.andWhere('t.identificacion = :identificacion', { identificacion });
    const rowsPausaAbierta: { id: string; trabajadorId: string; fecha: string; duracion: number }[] = await qbPausaA.getRawMany();

    // 3) Sin actividad por día dentro del rango sin iterar (generate_series)
    const params: any = { desde, hasta, lim: minInactividad };
    if (trabajadorId) params.trabajadorId = trabajadorId;
    if (identificacion) params.identificacion = identificacion;

    const trabFilterSql = trabajadorId
      ? ' AND t.id = :trabajadorId'
      : identificacion
      ? ' AND t.identificacion = :identificacion'
      : '';

    const sqlInact = `
      WITH days AS (
        SELECT generate_series(:desde::date, :hasta::date, interval '1 day')::date AS fecha
      ),
      st AS (
        SELECT st.id, st."trabajadorId", st."fechaInicio"
        FROM "sesion_trabajo" st
        JOIN "trabajador" t ON t.id = st."trabajadorId"
        WHERE st."fechaFin" IS NULL
          AND st."fechaInicio"::date BETWEEN :desde::date AND :hasta::date${trabFilterSql}
      ),
      lr AS (
        SELECT r."sesionTrabajoId" AS sesion_id,
               (r."minutoInicio"::date) AS fecha,
               MAX(r."minutoInicio") AS last_min
        FROM "registro_minuto" r
        WHERE (r.pedaleadas > 0 OR r."piezasContadas" > 0)
          AND r."minutoInicio"::date BETWEEN :desde::date AND :hasta::date
        GROUP BY r."sesionTrabajoId", (r."minutoInicio"::date)
      )
      SELECT d.fecha::text AS fecha,
             st.id AS "sesionId",
             st."trabajadorId" AS "trabajadorId",
             EXTRACT(EPOCH FROM (
               (CASE WHEN d.fecha = CURRENT_DATE THEN NOW() ELSE (d.fecha + time '23:59:59')::timestamp END)
               - COALESCE(lr.last_min, st."fechaInicio")
             ))/60 AS minutos
      FROM days d
      JOIN st ON st."fechaInicio"::date = d.fecha
      LEFT JOIN lr ON lr.sesion_id = st.id AND lr.fecha = d.fecha
      WHERE EXTRACT(EPOCH FROM (
               (CASE WHEN d.fecha = CURRENT_DATE THEN NOW() ELSE (d.fecha + time '23:59:59')::timestamp END)
               - COALESCE(lr.last_min, st."fechaInicio")
             ))/60 > :lim
    `;

    // Ejecutar como una única consulta cruda
    const rowsInact = await this.stRepo.query(sqlInact, params) as Array<{
      fecha: string;
      sesionId: string;
      trabajadorId: string;
      minutos: number;
    }>;

    // Mapear trabajadores para nombres
    const ensureTrabajadores = async (ids: string[]) => {
      if (!ids.length) return new Map<string, Trabajador>();
      const list = await this.trabajadorRepo.findBy({ id: In(ids) });
      return new Map(list.map((t) => [t.id, t]));
    };

    // Tipos
    const tipoDescansos = await this.tipoRepo.findOneBy({
      codigo: AlertaTipoCodigo.TRABAJADOR_DEMASIADOS_DESCANSOS_EN_DIA,
    });
    const tipoPausaLarga = await this.tipoRepo.findOneBy({
      codigo: AlertaTipoCodigo.TRABAJADOR_PAUSA_LARGA,
    });
    const tipoSinActividad = await this.tipoRepo.findOneBy({
      codigo: AlertaTipoCodigo.SIN_ACTIVIDAD,
    });

    const resultados: any[] = [];

    // 1) Descansos
    const mapTrab1 = await ensureTrabajadores(rowsDescansos.map((r) => r.trabajadorId));
    resultados.push(
      ...rowsDescansos.map((r) => ({
        id: undefined,
        tipo: tipoDescansos!,
        sujeto: {
          tipo: AlertaSujetoTipo.TRABAJADOR,
          id: r.trabajadorId,
          nombre: mapTrab1.get(r.trabajadorId)?.nombre ?? '',
        },
        fecha: r.fecha,
        metadata: { total: Number(r.total), limite: maxDescansos },
      })),
    );

    // 2) Pausas cerradas y abiertas
    const mapTrab2 = await ensureTrabajadores([
      ...rowsPausaCerrada.map((r) => r.trabajadorId),
      ...rowsPausaAbierta.map((r) => r.trabajadorId),
    ]);
    resultados.push(
      ...rowsPausaCerrada.map((r) => ({
        id: undefined,
        tipo: tipoPausaLarga!,
        sujeto: {
          tipo: AlertaSujetoTipo.TRABAJADOR,
          id: r.trabajadorId,
          nombre: mapTrab2.get(r.trabajadorId)?.nombre ?? '',
        },
        fecha: r.fecha,
        metadata: { pausaId: r.id, duracionMin: Math.round(Number(r.duracion)), abierta: false, limite: maxPausaMin },
      })),
      ...rowsPausaAbierta.map((r) => ({
        id: undefined,
        tipo: tipoPausaLarga!,
        sujeto: {
          tipo: AlertaSujetoTipo.TRABAJADOR,
          id: r.trabajadorId,
          nombre: mapTrab2.get(r.trabajadorId)?.nombre ?? '',
        },
        fecha: r.fecha,
        metadata: { pausaId: r.id, duracionMin: Math.round(Number(r.duracion)), abierta: true, limite: maxPausaMin },
      })),
    );

    // 3) Sin actividad
    const mapTrab3 = await ensureTrabajadores(rowsInact.map((r) => r.trabajadorId));
    resultados.push(
      ...rowsInact.map((r) => ({
        id: undefined,
        tipo: tipoSinActividad!,
        sujeto: {
          tipo: AlertaSujetoTipo.TRABAJADOR,
          id: r.trabajadorId,
          nombre: mapTrab3.get(r.trabajadorId)?.nombre ?? '',
        },
        fecha: r.fecha,
        metadata: {
          sesionId: r.sesionId,
          minutosSinActividad: Math.round(Number(r.minutos)),
          limite: minInactividad,
          motivo: 'SIN_ACTIVIDAD',
        },
      })),
    );

    // Cabecera con trabajador
    let trabajador: Trabajador | null = null;
    if (trabajadorId) {
      trabajador = await this.trabajadorRepo.findOne({ where: { id: trabajadorId } });
    } else if (identificacion) {
      trabajador = await this.trabajadorRepo.findOne({ where: { identificacion } });
    }

    return {
      desde,
      hasta,
      trabajador: trabajador
        ? { id: trabajador.id, nombre: trabajador.nombre, identificacion: trabajador.identificacion }
        : null,
      total: resultados.length,
      alertas: resultados,
    };
  }

  // Alertas por máquina en rango (pausas largas y sin actividad)
  async getAlertasMaquinaRango(query: GetAlertasMaquinaRangoQuery) {
    const desde = (query.desde || '').slice(0, 10);
    const hasta = (query.hasta || '').slice(0, 10);
    if (!desde || !hasta) throw new Error('Parámetros desde y hasta son requeridos (YYYY-MM-DD).');

    const maxPausaMin = await this.configService.getMaxDuracionPausaMinutos();
    const minInactividad = await this.configService.getMinInactividad();

    // Resolver máquina por id/código/nombre
    let maquinaId = query.maquinaId?.trim();
    let maquina: Maquina | null = null;
    if (!maquinaId && query.maquina) {
      const key = query.maquina.trim();
      maquina = await this.maquinaRepo.findOne({ where: { id: key } });
      if (!maquina)
        maquina = await this.maquinaRepo.findOne({ where: { codigo: key } });
      if (!maquina)
        maquina = await this.maquinaRepo
          .createQueryBuilder('m')
          .where('LOWER(m.nombre) = LOWER(:n)', { n: key })
          .getOne();
      if (!maquina) throw new Error('Máquina no encontrada');
      maquinaId = maquina.id;
    }
    if (!maquinaId) throw new Error('Parámetro maquinaId o maquina es requerido');
    if (!maquina) maquina = await this.maquinaRepo.findOne({ where: { id: maquinaId } });

    // Tipos
    const tipoPausaLarga = await this.tipoRepo.findOneBy({ codigo: AlertaTipoCodigo.TRABAJADOR_PAUSA_LARGA });
    const tipoSinActividad = await this.tipoRepo.findOneBy({ codigo: AlertaTipoCodigo.SIN_ACTIVIDAD });

    const resultados: any[] = [];

    // Pausas cerradas
    let qbPausaC = this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'stp')
      .innerJoin('stp.sesionTrabajo', 'st')
      .innerJoin('st.maquina', 'm')
      .select('p.id', 'id')
      .addSelect('m.id', 'maquinaId')
      .addSelect("TO_CHAR(p.inicio, 'YYYY-MM-DD')", 'fecha')
      .addSelect("EXTRACT(EPOCH FROM (p.fin - p.inicio))/60", 'duracion')
      .where('p.fin IS NOT NULL')
      .andWhere('m.id = :maquinaId', { maquinaId })
      .andWhere("p.inicio::date BETWEEN :desde::date AND :hasta::date", { desde, hasta })
      .andWhere('EXTRACT(EPOCH FROM (p.fin - p.inicio))/60 > :lim', { lim: maxPausaMin });
    const rowsPausaCerrada = await qbPausaC.getRawMany<{ id: string; maquinaId: string; fecha: string; duracion: number }>();

    // Pausas abiertas
    let qbPausaA = this.pausaRepo
      .createQueryBuilder('p')
      .innerJoin('p.pasoSesion', 'stp')
      .innerJoin('stp.sesionTrabajo', 'st')
      .innerJoin('st.maquina', 'm')
      .select('p.id', 'id')
      .addSelect('m.id', 'maquinaId')
      .addSelect("TO_CHAR(p.inicio, 'YYYY-MM-DD')", 'fecha')
      .addSelect("EXTRACT(EPOCH FROM (NOW() - p.inicio))/60", 'duracion')
      .where('p.fin IS NULL')
      .andWhere('m.id = :maquinaId', { maquinaId })
      .andWhere("p.inicio::date BETWEEN :desde::date AND :hasta::date", { desde, hasta })
      .andWhere('EXTRACT(EPOCH FROM (NOW() - p.inicio))/60 > :lim', { lim: maxPausaMin });
    const rowsPausaAbierta = await qbPausaA.getRawMany<{ id: string; maquinaId: string; fecha: string; duracion: number }>();

    // Sin actividad con generate_series
    const rowsInact = (await this.stRepo.query(
      `WITH days AS (
        SELECT generate_series($1::date, $2::date, interval '1 day')::date AS fecha
      ),
      st AS (
        SELECT st.id, st."maquinaId", st."fechaInicio"
        FROM "sesion_trabajo" st
        WHERE st."fechaFin" IS NULL
          AND st."maquinaId" = $3
          AND st."fechaInicio"::date BETWEEN $1::date AND $2::date
      ),
      lr AS (
        SELECT r."sesionTrabajoId" AS sesion_id,
               (r."minutoInicio"::date) AS fecha,
               MAX(r."minutoInicio") AS last_min
        FROM "registro_minuto" r
        WHERE (r.pedaleadas > 0 OR r."piezasContadas" > 0)
          AND r."minutoInicio"::date BETWEEN $1::date AND $2::date
        GROUP BY r."sesionTrabajoId", (r."minutoInicio"::date)
      )
      SELECT d.fecha::text AS fecha,
             st.id AS "sesionId",
             st."maquinaId" AS "maquinaId",
             EXTRACT(EPOCH FROM (
               (CASE WHEN d.fecha = CURRENT_DATE THEN NOW() ELSE (d.fecha + time '23:59:59')::timestamp END)
               - COALESCE(lr.last_min, st."fechaInicio")
             ))/60 AS minutos
      FROM days d
      JOIN st ON st."fechaInicio"::date = d.fecha
      LEFT JOIN lr ON lr.sesion_id = st.id AND lr.fecha = d.fecha
      WHERE EXTRACT(EPOCH FROM (
               (CASE WHEN d.fecha = CURRENT_DATE THEN NOW() ELSE (d.fecha + time '23:59:59')::timestamp END)
               - COALESCE(lr.last_min, st."fechaInicio")
             ))/60 > $4`,
      [desde, hasta, maquinaId, minInactividad],
    )) as Array<{ fecha: string; sesionId: string; maquinaId: string; minutos: number }>;

    // Mapear resultados
    const maquinaNombre = maquina?.nombre ?? '';

    resultados.push(
      ...rowsPausaCerrada.map((r) => ({
        id: undefined,
        tipo: tipoPausaLarga!,
        sujeto: { tipo: AlertaSujetoTipo.MAQUINA, id: r.maquinaId, nombre: maquinaNombre },
        fecha: r.fecha,
        metadata: { pausaId: r.id, duracionMin: Math.round(Number(r.duracion)), abierta: false, limite: maxPausaMin },
      })),
      ...rowsPausaAbierta.map((r) => ({
        id: undefined,
        tipo: tipoPausaLarga!,
        sujeto: { tipo: AlertaSujetoTipo.MAQUINA, id: r.maquinaId, nombre: maquinaNombre },
        fecha: r.fecha,
        metadata: { pausaId: r.id, duracionMin: Math.round(Number(r.duracion)), abierta: true, limite: maxPausaMin },
      })),
      ...rowsInact.map((r) => ({
        id: undefined,
        tipo: tipoSinActividad!,
        sujeto: { tipo: AlertaSujetoTipo.MAQUINA, id: r.maquinaId, nombre: maquinaNombre },
        fecha: r.fecha,
        metadata: { sesionId: r.sesionId, minutosSinActividad: Math.round(Number(r.minutos)), limite: minInactividad, motivo: 'SIN_ACTIVIDAD' },
      })),
    );

    return {
      desde,
      hasta,
      maquina: maquina ? { id: maquina.id, nombre: maquina.nombre, codigo: maquina.codigo } : { id: maquinaId },
      total: resultados.length,
      alertas: resultados,
    };
  }
}
