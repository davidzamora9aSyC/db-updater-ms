import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { EstadoTrabajador } from './estado-trabajador.entity';
import { CreateEstadoTrabajadorDto } from './dto/create-estado-trabajador.dto';
import { UpdateEstadoTrabajadorDto } from './dto/update-estado-trabajador.dto';

@Injectable()
export class EstadoTrabajadorService {
  constructor(
    @InjectRepository(EstadoTrabajador)
    private readonly repo: Repository<EstadoTrabajador>,
  ) {}

  async create(dto: CreateEstadoTrabajadorDto) {
    const entity = this.repo.create({
      trabajador: { id: dto.trabajador } as any,
      descanso: dto.descanso,
      inicio: DateTime.fromJSDate(dto.inicio, { zone: 'America/Bogota' }).toJSDate(),
      fin: dto.fin
        ? DateTime.fromJSDate(dto.fin, { zone: 'America/Bogota' }).toJSDate()
        : null,
    });
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({ relations: ['trabajador'] });
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    return estado;
  }

  async update(id: string, dto: UpdateEstadoTrabajadorDto) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    if (dto.trabajador)
      estado.trabajador = { id: dto.trabajador } as any;
    if (dto.descanso !== undefined) estado.descanso = dto.descanso;
    if (dto.inicio)
      estado.inicio = DateTime.fromJSDate(dto.inicio, { zone: 'America/Bogota' }).toJSDate();
    if (dto.fin)
      estado.fin = DateTime.fromJSDate(dto.fin, { zone: 'America/Bogota' }).toJSDate();
    return this.repo.save(estado);
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }

  findByTrabajador(trabajadorId: string) {
    return this.repo.find({
      where: { trabajador: { id: trabajadorId } },
      relations: ['trabajador'],
      order: { inicio: 'DESC' },
    });
  }
}
