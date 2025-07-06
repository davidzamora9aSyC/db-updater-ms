import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Asignacion, AsignacionDocument } from './asignacion.schema';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';

@Injectable()
export class AsignacionService {
  constructor(@InjectModel(Asignacion.name) private model: Model<AsignacionDocument>) {}

  async crear(dto: CreateAsignacionDto) {
    return this.model.create(dto);
  }

  async obtenerPorId(id: string) {
    const asignacion = await this.model.findById(id);
    if (!asignacion) throw new NotFoundException('Asignación no encontrada');
    return asignacion;
  }

  async listar() {
    return this.model.find().sort({ createdAt: -1 });
  }
}