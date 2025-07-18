import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoRecurso } from './estado-recurso.entity';
import { CreateEstadoRecursoDto } from './dto/create-estado-recurso.dto';
import { UpdateEstadoRecursoDto } from './dto/update-estado-recurso.dto';

@Injectable()
export class EstadoRecursoService {
  constructor(
    @InjectRepository(EstadoRecurso)
    private readonly repo: Repository<EstadoRecurso>,
  ) {}

  create(dto: CreateEstadoRecursoDto) {
    const nuevo = this.repo.create({
      ...dto,
      recurso: { id: dto.recurso } as any,
    });
    return this.repo.save(nuevo);
  }

  findAll() {
    return this.repo.find({ relations: ['recurso'] });
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({ where: { id }, relations: ['recurso'] });
    if (!estado) throw new NotFoundException('Estado recurso no encontrado');
    return estado;
  }

  async update(id: string, dto: UpdateEstadoRecursoDto) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado recurso no encontrado');
    if (dto.recurso) estado.recurso = { id: dto.recurso } as any;
    Object.assign(estado, dto);
    return this.repo.save(estado);
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado recurso no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }
}
