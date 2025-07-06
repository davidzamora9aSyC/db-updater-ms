import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PasoProduccion } from './paso-produccion.entity'

@Injectable()
export class PasoProduccionService {
  constructor(
    @InjectRepository(PasoProduccion) private readonly repo: Repository<PasoProduccion>
  ) {}

  async findOne(id: string) {
    const paso = await this.repo.findOne({ where: { id } });
    if (!paso) throw new NotFoundException('Paso no encontrado');
    return paso;
  }
}