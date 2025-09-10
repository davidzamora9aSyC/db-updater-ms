import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Alerta } from './alerta.entity';
import { AlertaTipo, AlertaTipoCodigo } from './alerta-tipo.entity';
import { PausaPasoSesion } from '../pausa-paso-sesion/pausa-paso-sesion.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { Trabajador } from '../trabajador/trabajador.entity';
import { AlertaSujetoTipo } from './alerta.entity';
import { RegistroMinuto } from '../registro-minuto/registro-minuto.entity';
import { ConfiguracionService } from '../configuracion/configuracion.service';

export interface GetAlertasQuery {
  fecha?: string; // YYYY-MM-DD
  trabajadorId?: string;
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
    const trabajadorId = query.trabajadorId;
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
    if (trabajadorId) qbDesc = qbDesc.andWhere('t.id = :trabajadorId', { trabajadorId });
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
    if (trabajadorId) qbPausaC = qbPausaC.andWhere('t.id = :trabajadorId', { trabajadorId });
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
    if (trabajadorId) qbPausaA = qbPausaA.andWhere('t.id = :trabajadorId', { trabajadorId });
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
    if (trabajadorId) qbInact = qbInact.andWhere('t.id = :trabajadorId', { trabajadorId });
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
}
