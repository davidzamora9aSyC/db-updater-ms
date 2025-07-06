import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Productividad } from './productividad.schema'

@Injectable()
export class ProductividadService {
  constructor(@InjectModel(Productividad.name) private readonly model: Model<Productividad>) {}

  async getMasProductivos(anio: number, mes: number) {
    return this.model.aggregate([
      {
        $match: {
          anio,
          mes
        }
      },
      {
        $group: {
          _id: '$trabajadorId',
          total: { $sum: '$cantidad' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 10
      }
    ])
  }

  async getResumenPorTrabajador(trabajadorId: string) {
    return this.model.find({ trabajadorId }).sort({ fecha: -1 }).limit(30)
  }
}