import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PausaPasoSesion } from './pausa-paso-sesion.entity';

@Injectable()
export class PausaPasoSesionService {
  constructor(
    @InjectRepository(PausaPasoSesion)
    private readonly repo: Repository<PausaPasoSesion>,
  ) {}

  create(pasoSesionId: string, inicio: Date = new Date()) {
    const entity = this.repo.create({
      pasoSesion: { id: pasoSesionId } as any,
      inicio,
      fin: null,
    });
    return this.repo.save(entity);
  }

  findActive(pasoSesionId: string) {
    return this.repo.findOne({
      where: { pasoSesion: { id: pasoSesionId }, fin: IsNull() },
      order: { inicio: 'DESC' },
    });
  }

  async closeActive(pasoSesionId: string, fin: Date = new Date()) {
    const active = await this.findActive(pasoSesionId);
    if (!active) return null;
    active.fin = fin;
    return this.repo.save(active);
  }
}
