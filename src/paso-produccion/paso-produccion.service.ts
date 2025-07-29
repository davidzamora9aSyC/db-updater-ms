import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PasoProduccion, EstadoPasoOrden } from './paso-produccion.entity'
import { OrdenProduccion, EstadoOrdenProduccion } from '../orden-produccion/entity'
import { CreatePasoProduccionDto } from './dto/create-paso-produccion.dto'
import { UpdatePasoProduccionDto } from './dto/update-paso-produccion.dto'

@Injectable()
export class PasoProduccionService {
  constructor(
    @InjectRepository(PasoProduccion) private readonly repo: Repository<PasoProduccion>
  ) {}

  create(dto: CreatePasoProduccionDto) {
    const paso = this.repo.create({
      ...dto,
      orden: { id: dto.orden } as any,
    });
    return this.repo.save(paso);
  }

  findAll() {
    return this.repo.find({ relations: ['orden'] });
  }

  async findOne(id: string) {
    const paso = await this.repo.findOne({ where: { id } });
    if (!paso) throw new NotFoundException('Paso no encontrado');
    return paso;
  }

  async update(id: string, dto: UpdatePasoProduccionDto) {
    const paso = await this.repo.findOne({ where: { id }, relations: ['orden'] });
    if (!paso) throw new NotFoundException('Paso no encontrado');
    if (dto.orden) paso.orden = { id: dto.orden } as any;
    const estadoPrevio = paso.estado;
    Object.assign(paso, dto);
    const saved = await this.repo.save(paso);

    if (
      dto.estado &&
      dto.estado !== estadoPrevio &&
      dto.estado === EstadoPasoOrden.FINALIZADO
    ) {
      const pasos = await this.repo.find({ where: { orden: { id: paso.orden.id } } });
      const allFin = pasos.every((p) => p.estado === EstadoPasoOrden.FINALIZADO);
      const anyPause = pasos.some((p) => p.estado === EstadoPasoOrden.PAUSADO);
      const ordenRepo = this.repo.manager.getRepository(OrdenProduccion);
      const orden = await ordenRepo.findOne({ where: { id: paso.orden.id } });
      if (orden) {
        if (allFin) {
          orden.estado = EstadoOrdenProduccion.FINALIZADA;
        } else if (anyPause) {
          orden.estado = EstadoOrdenProduccion.PAUSADA;
        }
        await ordenRepo.save(orden);
      }
    }

    return saved;
  }

  async remove(id: string) {
    const paso = await this.repo.findOne({ where: { id } });
    if (!paso) throw new NotFoundException('Paso no encontrado');
    await this.repo.remove(paso);
    return { deleted: true };
  }

  async findByOrden(ordenId: string) {
    return this.repo.find({
      where: { orden: { id: ordenId } },
      relations: ['orden'],
      order: { createdAt: 'ASC' }
    });
  }
}