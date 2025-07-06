import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Recurso } from './recurso.schema';
import { Model } from 'mongoose';

@Injectable()
export class RecursoService {
  constructor(@InjectModel(Recurso.name) private readonly model: Model<Recurso>) {}

  async findAll() {
    return this.model.find().populate('trabajador maquina');
  }

  async findActuales() {
    return this.model.find({ activo: true }).populate('trabajador maquina');
  }

  async findOne(id: string) {
    const recurso = await this.model.findById(id).populate('trabajador maquina');
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    return recurso;
  }

  async toggleEstado(id: string) {
    const recurso = await this.model.findById(id);
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    recurso.activo = !recurso.activo;
    return recurso.save();
  }
}