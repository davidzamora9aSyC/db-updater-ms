import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PasoProduccion, PasoProduccionDocument } from './paso-produccion.schema'

@Injectable()
export class PasoProduccionService {
  constructor(
    @InjectModel(PasoProduccion.name) private pasoModel: Model<PasoProduccionDocument>
  ) {}

  async findOne(id: string) {
    const paso = await this.pasoModel.findById(id)
    if (!paso) throw new NotFoundException('Paso no encontrado')
    return paso
  }
}