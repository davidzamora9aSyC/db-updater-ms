import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maquina, EstadoMaquina } from './maquina.entity';

@Injectable()
export class MaquinaService {
  constructor(@InjectRepository(Maquina) private readonly repo: Repository<Maquina>) {}

  async create(dto: CreateMaquinaDto) {
    const nueva = this.repo.create(dto);
    return this.repo.save(nueva);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const maquina = await this.repo.findOne({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    return maquina;
  }

  async updateEstado(id: string, dto: UpdateEstadoDto) {
    const maquina = await this.repo.findOne({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    maquina.estado = dto.estado as EstadoMaquina;
    return this.repo.save(maquina);
  }

  async update(id: string, dto: UpdateMaquinaDto) {
    const maquina = await this.repo.findOne({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    Object.assign(maquina, dto);
    return this.repo.save(maquina);
  }

  async remove(id: string) {
    const maquina = await this.repo.findOne({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    return this.repo.remove(maquina);
  }
}