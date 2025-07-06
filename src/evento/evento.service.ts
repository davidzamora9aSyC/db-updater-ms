import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Evento, EventoTipo } from './evento.entity'
import { CrearEventoDto } from './dto/crear-evento.dto'

@Injectable()
export class EventoService {
  constructor(@InjectRepository(Evento) private readonly repo: Repository<Evento>) {}

  async registrar(tipo: EventoTipo, dto: CrearEventoDto) {
    const evento = this.repo.create({ tipo, ...dto })
    return this.repo.save(evento)
  }
}