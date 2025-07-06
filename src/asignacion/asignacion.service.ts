import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asignacion } from './asignacion.entity';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';

@Injectable()
export class AsignacionService {
  constructor(@InjectRepository(Asignacion) private readonly repo: Repository<Asignacion>) {}

  async crear(dto: CreateAsignacionDto) {
    const nueva = this.repo.create(dto);
    return this.repo.save(nueva);
  }

  async obtenerPorId(id: string) {
    const asignacion = await this.repo.findOne({ where: { id } });
    if (!asignacion) throw new NotFoundException('Asignación no encontrada');
    return asignacion;
  }

  async listar() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}