import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maquina } from './maquina.entity';

@Injectable()
export class MaquinaService {
  constructor(@InjectRepository(Maquina) private readonly repo: Repository<Maquina>) {}

  async create(dto: CreateMaquinaDto) {
    const existente = await this.repo.findOne({ where: { codigo: dto.codigo } });
    if (existente)
      throw new BadRequestException('No se puede repetir el codigo de equipo');
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