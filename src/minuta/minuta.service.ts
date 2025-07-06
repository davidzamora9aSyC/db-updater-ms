import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Minuta } from './minuta.schema'
import { CreateMinutaDto } from './dto/create-minuta.dto'

@Injectable()
export class MinutaService {
  constructor(@InjectModel(Minuta.name) private model: Model<Minuta>) {}

  create(dto: CreateMinutaDto) {
    return this.model.create(dto)
  }

  findAll() {
    return this.model.find().sort({ createdAt: -1 }).exec()
  }

  findOne(id: string) {
    return this.model.findById(id).exec()
  }
}