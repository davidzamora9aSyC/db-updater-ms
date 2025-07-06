import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Evento, EventoTipo } from './evento.schema'
import { CrearEventoDto } from './dto/crear-evento.dto'

@Injectable()
export class EventoService {
  constructor(@InjectModel(Evento.name) private model: Model<Evento>) {}

  async registrar(tipo: EventoTipo, dto: CrearEventoDto) {
    return this.model.create({ tipo, ...dto })
  }
}