import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
    const sesion = this.repo.create({
      trabajador: { id: dto.trabajador } as any,
      maquina: { id: dto.maquina } as any,
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
    return this.formatSesionForResponse({
      ...sesionConEstado,
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
      relations: ['trabajador'],
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
    return this.formatSesionForResponse(sesion);
  }

  async remove(id: string) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    await this.repo.remove(sesion);
    return { deleted: true };
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
  
  async findActuales() {
    const sesiones = await this.repo.find({ where: { fechaFin: IsNull() }, relations: ['trabajador', 'maquina'] });
    const minutosInactividadParaNPT = await this.configService.getMinInactividad();
    const resultado: any[] = [];
    for (const sesion of sesiones) {
      const sesionConEstado = await this.mapSesionConEstado(sesion);
      const registros = await this.registroMinutoService.obtenerPorSesion(sesion.id);
      const registrosOrdenados = this.ordenarRegistros(registros);
      const { tieneRegistros, sessionStart, lastSlot, fin, totalMin } = this.obtenerTiemposSesion(sesion, registrosOrdenados);
      const segmentosInactivos = this.construirSegmentosInactividad(registrosOrdenados, sessionStart, fin);
      const { totalPiezas, totalPedales, defectos } = this.aggregates(registros);
      const nptMin = this.nptMinUnifiedFrom(segmentosInactivos);
      const nptPorInactividad = this.nptPorInactividadFromSegments(segmentosInactivos, minutosInactividadParaNPT);
      const nptNoProductivoTotal = Math.min(totalMin, nptMin);
      const { avgProd, avgSesion } = this.promedios(totalPiezas, totalMin, nptNoProductivoTotal);
      const { velocidadActual } = this.ventanaMetrics(registrosOrdenados, 10, fin, sessionStart, minutosInactividadParaNPT);
      const porcentajeNPT = this.porcentajeNPTFrom(totalMin, nptNoProductivoTotal);
      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const estadoActual = estados[0];
      resultado.push({
        ...sesionConEstado,
        grupo: sesion.maquina?.tipo,
        estadoInicio: estadoActual?.inicio,
        avgSpeed: avgProd,
        avgSpeedSesion: avgSesion,
        velocidadActual,
        nptMin: nptNoProductivoTotal,
        nptPorInactividad,
        porcentajeNPT,
        defectos,
        produccionTotal: totalPiezas,
      });
    }
    return resultado.map(r => this.formatSesionForResponse(r));
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

  private async finalizarSesionesPrevias(trabajadorId: string) {
    const activas = await this.repo.find({
      where: {
        fechaFin: IsNull(),
        trabajador: { id: trabajadorId },
      },
    });

    for (const sesion of activas) {
      sesion.fechaFin = DateTime.now().setZone('America/Bogota').toJSDate();
      await this.repo.save(sesion);
    }
  }
}
