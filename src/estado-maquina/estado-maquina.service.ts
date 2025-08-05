import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { EstadoMaquina } from './estado-maquina.entity';
import { CreateEstadoMaquinaDto } from './dto/create-estado-maquina.dto';
import { UpdateEstadoMaquinaDto } from './dto/update-estado-maquina.dto';

@Injectable()
export class EstadoMaquinaService {
  constructor(
    @InjectRepository(EstadoMaquina)
    private readonly repo: Repository<EstadoMaquina>,
  ) {}

  async create(dto: CreateEstadoMaquinaDto) {
    const entity = this.repo.create({
      maquina: { id: dto.maquina } as any,
      mantenimiento: dto.mantenimiento,
      inicio: DateTime.fromJSDate(dto.inicio, { zone: 'America/Bogota' }).toJSDate(),
      fin: dto.fin
        ? DateTime.fromJSDate(dto.fin, { zone: 'America/Bogota' }).toJSDate()
        : null,
    });
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({ relations: ['maquina'] });
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['maquina'],
    });
    if (!estado) throw new NotFoundException('Estado de máquina no encontrado');
    return estado;
  }

  async update(id: string, dto: UpdateEstadoMaquinaDto) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de máquina no encontrado');
    if (dto.maquina) estado.maquina = { id: dto.maquina } as any;
    if (dto.mantenimiento !== undefined) estado.mantenimiento = dto.mantenimiento;
    if (dto.inicio)
      estado.inicio = DateTime.fromJSDate(dto.inicio, { zone: 'America/Bogota' }).toJSDate();
    if (dto.fin)
      estado.fin = DateTime.fromJSDate(dto.fin, { zone: 'America/Bogota' }).toJSDate();
    return this.repo.save(estado);
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de máquina no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }

  findByMaquina(maquinaId: string) {
    return this.repo.find({
      where: { maquina: { id: maquinaId } },
      relations: ['maquina'],
      order: { inicio: 'DESC' },
    });
  }
}
