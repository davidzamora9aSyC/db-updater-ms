import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionTrabajo, EstadoSesionTrabajo } from './sesion-trabajo.entity';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';
import { RegistroMinutoService } from '../registro-minuto/registro-minuto.service';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';

@Injectable()
export class SesionTrabajoService {
  constructor(
    @InjectRepository(SesionTrabajo)
    private readonly repo: Repository<SesionTrabajo>,
    private readonly registroMinutoService: RegistroMinutoService,
    private readonly estadoSesionService: EstadoSesionService,
  ) { }

  create(dto: CreateSesionTrabajoDto) {
    const sesion = this.repo.create({
      ...dto,
      trabajador: { id: dto.trabajador } as any,
      maquina: { id: dto.maquina } as any,
    });
    return this.repo.save(sesion);
  }

  findAll() {
    return this.repo.find({ relations: ['trabajador', 'maquina'] });
  }

  async findOne(id: string) {
    const sesion = await this.repo.findOne({ where: { id }, relations: ['trabajador', 'maquina'] });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    return sesion;
  }

  async update(id: string, dto: UpdateSesionTrabajoDto) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    if (dto.trabajador) sesion.trabajador = { id: dto.trabajador } as any;
    if (dto.maquina) sesion.maquina = { id: dto.maquina } as any;
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
  
    const minutosInactividadParaNPT = await this.configService.getMinInactividad(); // configurable
    const resultado: any[] = [];
  
    for (const sesion of sesiones) {
      const registros = await this.registroMinutoService.obtenerPorSesion(sesion.id);
      const totalPiezas = registros.reduce((a, b) => a + b.piezasContadas, 0);
      const totalPedales = registros.reduce((a, b) => a + b.pedaleadas, 0);
  
      const minutos = (Date.now() - new Date(sesion.fechaInicio).getTime()) / 60000;
      const velocidad = minutos > 0 ? (totalPiezas / minutos) * 60 : 0;
      const defectos = totalPedales - totalPiezas;
  
      const nptMinRegistro = registros.filter(r => r.pedaleadas === 0 && r.piezasContadas === 0).length;
  
      let nptPorInactividad = 0;
      const ordenados = registros.sort((a, b) => new Date(a.minutoInicio).getTime() - new Date(b.minutoInicio).getTime());
      for (let i = 1; i < ordenados.length; i++) {
        const diff = (new Date(ordenados[i].minutoInicio).getTime() - new Date(ordenados[i - 1].minutoInicio).getTime()) / 60000;
        if (diff > minutosInactividadParaNPT) nptPorInactividad += (diff - minutosInactividadParaNPT);
      }
  
      const nptTotal = nptMinRegistro + nptPorInactividad;
      const porcentajeNPT = minutos > 0 ? (nptTotal / minutos) * 100 : 0;
  
      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const estadoActual = estados[0];
  
      resultado.push({
        ...sesion,
        grupo: sesion.maquina?.tipo,
        estadoSesion: estadoActual?.estado,
        estadoInicio: estadoActual?.inicio,
        avgSpeed: velocidad,
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
