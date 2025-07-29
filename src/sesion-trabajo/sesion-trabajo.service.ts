import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionTrabajo, EstadoSesionTrabajo } from './sesion-trabajo.entity';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';
import { RegistroMinutoService } from '../registro-minuto/registro-minuto.service';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { DateTime } from 'luxon';

@Injectable()
export class SesionTrabajoService {
  constructor(
    @InjectRepository(SesionTrabajo)
    private readonly repo: Repository<SesionTrabajo>,
    private readonly registroMinutoService: RegistroMinutoService,
    private readonly estadoSesionService: EstadoSesionService,
    private readonly configService: ConfiguracionService,
  ) {}

  async create(dto: CreateSesionTrabajoDto) {
    const sesion = this.repo.create({
      ...dto,
      fechaInicio: DateTime.now().setZone('America/Bogota').toJSDate(),
      fechaFin: dto.fechaFin
        ? DateTime.fromJSDate(dto.fechaFin, { zone: 'America/Bogota' }).toJSDate()
        : undefined,
      trabajador: { id: dto.trabajador } as any,
      maquina: { id: dto.maquina } as any,
    });
    return this.repo.save(sesion);
  }

  async findAll() {
    const sesiones = await this.repo.find({
      relations: ['trabajador', 'maquina'],
    });
    return sesiones;
  }

  async findOne(id: string) {
    const sesion = await this.repo.findOne({
      where: { id },
      relations: ['trabajador', 'maquina'],
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    return sesion;
  }

  async update(id: string, dto: UpdateSesionTrabajoDto) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    if (dto.trabajador) sesion.trabajador = { id: dto.trabajador } as any;
    if (dto.maquina) sesion.maquina = { id: dto.maquina } as any;
    if (dto.fechaInicio)
      sesion.fechaInicio = DateTime.fromJSDate(dto.fechaInicio, { zone: 'America/Bogota' }).toJSDate();
    if (dto.fechaFin)
      sesion.fechaFin = DateTime.fromJSDate(dto.fechaFin, { zone: 'America/Bogota' }).toJSDate();
    Object.assign(sesion, dto);
    return this.repo.save(sesion);
  }

  async remove(id: string) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    await this.repo.remove(sesion);
    return { deleted: true };
  }

  async findActuales() {
    const sesiones = await this.repo.find({
      where: { estado: EstadoSesionTrabajo.ACTIVA },
      relations: ['trabajador', 'maquina'],
    });

    const minutosInactividadParaNPT =
      await this.configService.getMinInactividad(); 
    const resultado: any[] = [];

    for (const sesion of sesiones) {
      const registros = await this.registroMinutoService.obtenerPorSesion(
        sesion.id,
      );
      const totalPiezas = registros.reduce((a, b) => a + b.piezasContadas, 0);
      const totalPedales = registros.reduce((a, b) => a + b.pedaleadas, 0);

      const defectos = totalPedales - totalPiezas;
      const nptMinRegistro = registros.filter(
        (r) => r.pedaleadas === 0 && r.piezasContadas === 0,
      ).length;
      let nptPorInactividad = 0;
      const ordenados = [...registros].sort(
        (a, b) =>
          DateTime.fromJSDate(a.minutoInicio, { zone: 'America/Bogota' }).toMillis() -
          DateTime.fromJSDate(b.minutoInicio, { zone: 'America/Bogota' }).toMillis(),
      );
      for (let i = 1; i < ordenados.length; i++) {
        const diff =
          DateTime.fromJSDate(ordenados[i].minutoInicio, { zone: 'America/Bogota' })
            .diff(DateTime.fromJSDate(ordenados[i - 1].minutoInicio, { zone: 'America/Bogota' }), 'minutes').minutes;
        if (diff > minutosInactividadParaNPT)
          nptPorInactividad += diff - minutosInactividadParaNPT;
      }
      const registrosOrdenados = [...ordenados];
      const tieneRegistros = registrosOrdenados.length > 0;
      const start = tieneRegistros
        ? Math.max(
            DateTime.fromJSDate(sesion.fechaInicio, { zone: 'America/Bogota' }).toMillis(),
            DateTime.fromJSDate(registrosOrdenados[0].minutoInicio, { zone: 'America/Bogota' }).toMillis(),
          )
        : DateTime.fromJSDate(sesion.fechaInicio, { zone: 'America/Bogota' }).toMillis();
      const lastSlot = tieneRegistros
        ? DateTime.fromJSDate(
            registrosOrdenados[registrosOrdenados.length - 1].minutoInicio,
            { zone: 'America/Bogota' },
          ).plus({ minutes: 1 }).toMillis()
        : 0;
      const end =
        sesion.estado === EstadoSesionTrabajo.ACTIVA
          ? DateTime.now().setZone('America/Bogota').toMillis()
          : sesion.fechaFin
          ? DateTime.fromJSDate(sesion.fechaFin, { zone: 'America/Bogota' }).toMillis()
          : DateTime.now().setZone('America/Bogota').toMillis();
      const fin = Math.max(end, lastSlot || end);
      const totalMin = Math.max(Number.EPSILON, (fin - start) / 60000);
      const nptTotal = Math.min(nptMinRegistro + nptPorInactividad, totalMin);
      const minProd = Math.max(Number.EPSILON, totalMin - nptTotal);
      const avgProd = (totalPiezas / minProd) * 60;
      const avgSesion = (totalPiezas / totalMin) * 60;
      const ventanaMin = 10;
      const corte = fin - ventanaMin * 60000;
      const regsVentana = registrosOrdenados.filter(
        (r) =>
          DateTime.fromJSDate(r.minutoInicio, { zone: 'America/Bogota' }).toMillis() >= corte,
      );
      const piezasVentana = regsVentana.reduce((a, b) => a + b.piezasContadas, 0);
      const nptVentanaReg = regsVentana.filter(
        (r) => r.pedaleadas === 0 && r.piezasContadas === 0,
      ).length;
      let nptVentanaGap = 0;
      for (let i = 1; i < regsVentana.length; i++) {
        const d =
          DateTime.fromJSDate(regsVentana[i].minutoInicio, { zone: 'America/Bogota' })
            .diff(
              DateTime.fromJSDate(regsVentana[i - 1].minutoInicio, { zone: 'America/Bogota' }),
              'minutes',
            ).minutes;
        if (d > minutosInactividadParaNPT) nptVentanaGap += d - minutosInactividadParaNPT;
      }
      const minVentana = Math.max(Number.EPSILON, (fin - Math.max(corte, start)) / 60000);
      const minVentanaProd = Math.max(
        Number.EPSILON,
        minVentana - Math.min(nptVentanaReg + nptVentanaGap, minVentana),
      );
      const velocidadActual = (piezasVentana / minVentanaProd) * 60;
      const porcentajeNPT = totalMin > 0 ? (nptTotal / totalMin) * 100 : 0;

      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const estadoActual = estados[0];

      resultado.push({
        ...sesion,
        grupo: sesion.maquina?.tipo,
        estadoSesion: estadoActual?.estado,
        estadoInicio: estadoActual?.inicio,
        avgSpeed: avgProd,
        avgSpeedSesion: avgSesion,
        velocidadActual,
        nptMin: nptMinRegistro,
        nptMinDia: nptTotal,
        nptPorInactividad,
        porcentajeNPT,
        defectos,
        produccionTotal: totalPiezas,
      });
    }

    return resultado;
  }
}
