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
  ) {}

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

    const resultado: any[] = [];
    for (const sesion of sesiones) {
      const registros = await this.registroMinutoService.obtenerPorSesion(sesion.id);
      const totalPiezas = registros.reduce((a, b) => a + b.piezasContadas, 0);
      const totalPedales = registros.reduce((a, b) => a + b.pedaleadas, 0);
      const horas = (Date.now() - new Date(sesion.fechaInicio).getTime()) / 3600000;
      const velocidad = horas > 0 ? totalPiezas / horas : 0;
      const defectos = totalPedales - totalPiezas;
      const nptMin = registros.filter(r => r.pedaleadas === 0 && r.piezasContadas === 0).length;
      const estados = await this.estadoSesionService.findBySesion(sesion.id);
      const estadoActual = estados[0];
      resultado.push({
        ...sesion,
        grupo: sesion.maquina?.tipo,
        estadoSesion: estadoActual?.estado,
        estadoInicio: estadoActual?.inicio,
        avgSpeed: velocidad,
        nptMin,
        nptMinDia: nptMin,
        defectos,
        produccionTotal: totalPiezas,
      });
    }
    return resultado;
  }
}
