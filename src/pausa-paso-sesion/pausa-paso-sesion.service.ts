import { PasoProduccionService } from '../paso-produccion/paso-produccion.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PausaPasoSesion } from './pausa-paso-sesion.entity';

@Injectable()
export class PausaPasoSesionService {
  constructor(
    @InjectRepository(PausaPasoSesion)
    private readonly repo: Repository<PausaPasoSesion>,
    private readonly pasoProduccionService: PasoProduccionService,
  ) {}

  async create(
    pasoSesionId: string,
    inicio: Date = new Date(),
    maquinaId?: string,
    trabajadorId?: string,
  ) {
    const entity = this.repo.create({
      pasoSesion: { id: pasoSesionId } as any,
      inicio,
      fin: null,
      maquinaId: maquinaId ?? null,
      trabajadorId: trabajadorId ?? null,
    });
    const saved = await this.repo.save(entity);
    await this.pasoProduccionService.verificarSesiones(pasoSesionId);
    return saved;
  }

  findActive(pasoSesionId: string) {
    return this.repo.findOne({
      where: { pasoSesion: { id: pasoSesionId }, fin: IsNull() },
      order: { inicio: 'DESC' },
    });
  }

  async closeActive(
    pasoSesionId: string,
    fin: Date = new Date(),
    maquinaId?: string,
    trabajadorId?: string,
  ) {
    const active = await this.findActive(pasoSesionId);
    if (!active) return null;
    if (
      (maquinaId && active.maquinaId !== maquinaId) ||
      (trabajadorId && active.trabajadorId !== trabajadorId)
    ) {
      return null;
    }
    active.fin = fin;
    const saved = await this.repo.save(active);
    await this.pasoProduccionService.verificarSesiones(pasoSesionId);
    return saved;
  }
}
