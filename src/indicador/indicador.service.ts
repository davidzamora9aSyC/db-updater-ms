import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Indicador } from './indicador.schema';

@Injectable()
export class IndicadorService {
  constructor(
    @InjectModel(Indicador.name) private readonly modelo: Model<Indicador>,
  ) {}

  async getGlobales() {
    return this.modelo.aggregate([
      { $group: {
          _id: null,
          totalPiezas: { $sum: '$piezas' },
          totalPedalazos: { $sum: '$pedalazos' },
        }
      }
    ]);
  }

  async getPorRecurso(recursoId: string) {
    return this.modelo.findOne({ recursoId }).lean();
  }

  async getPorMinuto(recursoId: string) {
    return this.modelo.find({ recursoId }).sort({ timestamp: -1 }).limit(60).lean();
  }
}