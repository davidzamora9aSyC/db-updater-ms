import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionTrabajo, EstadoSesionTrabajo } from './sesion-trabajo.entity';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';
import { RegistroMinutoService } from '../registro-minuto/registro-minuto.service';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';

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
      fechaInicio: new Date(),
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
    if (dto.fechaInicio) sesion.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) sesion.fechaFin = new Date(dto.fechaFin);
    Object.assign(sesion, dto);
    return this.repo.save(sesion);
  }

  async finalizar(id: string) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    sesion.estado = EstadoSesionTrabajo.FINALIZADA;
    sesion.fechaFin = new Date();
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
          new Date(a.minutoInicio).getTime() -
          new Date(b.minutoInicio).getTime(),
      );
      for (let i = 1; i < ordenados.length; i++) {
        const diff =
          (new Date(ordenados[i].minutoInicio).getTime() -
            new Date(ordenados[i - 1].minutoInicio).getTime()) /
          60000;
        if (diff > minutosInactividadParaNPT)
          nptPorInactividad += diff - minutosInactividadParaNPT;
      }
      const registrosOrdenados = [...ordenados];
      const tieneRegistros = registrosOrdenados.length > 0;
      const start = tieneRegistros
        ? Math.max(
            new Date(sesion.fechaInicio).getTime(),
            new Date(registrosOrdenados[0].minutoInicio).getTime(),
          )
        : new Date(sesion.fechaInicio).getTime();
      const lastSlot = tieneRegistros
        ? new Date(
            registrosOrdenados[registrosOrdenados.length - 1].minutoInicio,
          ).getTime() + 60000
        : 0;
      const end =
        sesion.estado === EstadoSesionTrabajo.ACTIVA
          ? Date.now()
          : sesion.fechaFin
          ? new Date(sesion.fechaFin).getTime()
          : Date.now();
      const fin = Math.max(end, lastSlot || end);
      const totalMin = Math.max(Number.EPSILON, (fin - start) / 60000);
      const nptTotal = Math.min(nptMinRegistro + nptPorInactividad, totalMin);
      const minProd = Math.max(Number.EPSILON, totalMin - nptTotal);
      const avgProd = (totalPiezas / minProd) * 60;
      const avgSesion = (totalPiezas / totalMin) * 60;
      const ventanaMin = 10;
      const corte = fin - ventanaMin * 60000;
      const regsVentana = registrosOrdenados.filter(
        (r) => new Date(r.minutoInicio).getTime() >= corte,
      );
      const piezasVentana = regsVentana.reduce((a, b) => a + b.piezasContadas, 0);
      const nptVentanaReg = regsVentana.filter(
        (r) => r.pedaleadas === 0 && r.piezasContadas === 0,
      ).length;
      let nptVentanaGap = 0;
      for (let i = 1; i < regsVentana.length; i++) {
        const d =
          (new Date(regsVentana[i].minutoInicio).getTime() -
            new Date(regsVentana[i - 1].minutoInicio).getTime()) /
          60000;
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
