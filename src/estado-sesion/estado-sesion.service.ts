import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoSesion } from './estado-sesion.entity';
import { CreateEstadoSesionDto } from './dto/create-estado-sesion.dto';
import { UpdateEstadoSesionDto } from './dto/update-estado-sesion.dto';
import { TimezoneService } from '../common/timezone.service';

@Injectable()
export class EstadoSesionService {
  constructor(
    @InjectRepository(EstadoSesion)
    private readonly repo: Repository<EstadoSesion>,
    private readonly tzService: TimezoneService,
  ) {}

  async create(dto: CreateEstadoSesionDto) {
    const nuevo = this.repo.create({
      ...dto,
      inicio: await this.tzService.toUTC(new Date(dto.inicio)),
      sesionTrabajo: { id: dto.sesionTrabajo } as any,
    });
    return this.repo.save(nuevo);
  }

  async findAll() {
    const estados = await this.repo.find({ relations: ['sesionTrabajo'] });
    for (const e of estados) {
      e.inicio = await this.tzService.fromUTC(e.inicio);
    }
    return estados;
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['sesionTrabajo'],
    });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    estado.inicio = await this.tzService.fromUTC(estado.inicio);
    return estado;
  }

  async update(id: string, dto: UpdateEstadoSesionDto) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    if (dto.sesionTrabajo)
      estado.sesionTrabajo = { id: dto.sesionTrabajo } as any;
    if (dto.inicio)
      estado.inicio = await this.tzService.toUTC(new Date(dto.inicio));
    Object.assign(estado, dto);
    return this.repo.save(estado);
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }

  async findBySesion(sesionTrabajoId: string) {
    const estados = await this.repo.find({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
      relations: ['sesionTrabajo'],
      order: { inicio: 'DESC' },
    });
    for (const e of estados) {
      e.inicio = await this.tzService.fromUTC(e.inicio);
    }
    return estados;
  }

  async removeBySesion(sesionTrabajoId: string) {
    const estados = await this.repo.find({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
    });
    await this.repo.remove(estados);
    return { deleted: true, count: estados.length };
  }
}
