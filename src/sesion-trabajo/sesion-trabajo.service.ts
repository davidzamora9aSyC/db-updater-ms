import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionTrabajo } from './sesion-trabajo.entity';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';

@Injectable()
export class SesionTrabajoService {
  constructor(
    @InjectRepository(SesionTrabajo)
    private readonly repo: Repository<SesionTrabajo>,
  ) {}

  create(dto: CreateSesionTrabajoDto) {
    const sesion = this.repo.create({
      ...dto,
      recurso: { id: dto.recurso } as any,
    });
    return this.repo.save(sesion);
  }

  findAll() {
    return this.repo.find({ relations: ['recurso'] });
  }

  async findOne(id: string) {
    const sesion = await this.repo.findOne({ where: { id }, relations: ['recurso'] });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    return sesion;
  }

  async update(id: string, dto: UpdateSesionTrabajoDto) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    if (dto.recurso) sesion.recurso = { id: dto.recurso } as any;
    Object.assign(sesion, dto);
    return this.repo.save(sesion);
  }

  async remove(id: string) {
    const sesion = await this.repo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    await this.repo.remove(sesion);
    return { deleted: true };
  }
}
