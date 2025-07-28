import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoSesion } from './estado-sesion.entity';
import { CreateEstadoSesionDto } from './dto/create-estado-sesion.dto';
import { UpdateEstadoSesionDto } from './dto/update-estado-sesion.dto';

@Injectable()
export class EstadoSesionService {
  constructor(
    @InjectRepository(EstadoSesion)
    private readonly repo: Repository<EstadoSesion>,
  ) {}

  create(dto: CreateEstadoSesionDto) {
    const nuevo = this.repo.create({
      ...dto,
      sesionTrabajo: { id: dto.sesionTrabajo } as any,
    });
    return this.repo.save(nuevo);
  }

  findAll() {
    return this.repo.find({ relations: ['sesionTrabajo'] });
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({ where: { id }, relations: ['sesionTrabajo'] });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    return estado;
  }

  async update(id: string, dto: UpdateEstadoSesionDto) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    if (dto.sesionTrabajo) estado.sesionTrabajo = { id: dto.sesionTrabajo } as any;
    Object.assign(estado, dto);
    return this.repo.save(estado);
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }

  findBySesion(sesionTrabajoId: string) {
    return this.repo.find({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
      relations: ['sesionTrabajo'],
      order: { inicio: 'DESC' },
    });
  }

  async removeBySesion(sesionTrabajoId: string) {
    const estados = await this.repo.find({ where: { sesionTrabajo: { id: sesionTrabajoId } } });
    await this.repo.remove(estados);
    return { deleted: true, count: estados.length };
  }
}
