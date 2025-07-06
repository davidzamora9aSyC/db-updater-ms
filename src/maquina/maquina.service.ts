import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maquina, MaquinaDocument } from './schema/maquina.schema';

@Injectable()
export class MaquinaService {
  constructor(@InjectModel(Maquina.name) private model: Model<MaquinaDocument>) {}

  async create(dto: CreateMaquinaDto) {
    return await this.model.create(dto);
  }

  async findAll() {
    return await this.model.find();
  }

  async findOne(id: string) {
    const maquina = await this.model.findById(id);
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    return maquina;
  }

  async updateEstado(id: string, dto: UpdateEstadoDto) {
    const maquina = await this.model.findByIdAndUpdate(id, { estado: dto.estado }, { new: true });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    return maquina;
  }
}