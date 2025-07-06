import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicador } from './indicador.entity';

@Injectable()
export class IndicadorService {
  constructor(
    @InjectRepository(Indicador) private readonly repo: Repository<Indicador>,
  ) {}

  async getGlobales() {
    const data = await this.repo.find();
    const totalPiezas = data.reduce((a, b) => a + b.piezas, 0);
    const totalPedalazos = data.reduce((a, b) => a + b.pedalazos, 0);
    return { totalPiezas, totalPedalazos };
  }

  async getPorRecurso(recursoId: string) {
    return this.repo.findOne({ where: { recursoId } });
  }

  async getPorMinuto(recursoId: string) {
    return this.repo.find({
      where: { recursoId },
      order: { timestamp: 'DESC' },
      take: 60
    });
  }
}