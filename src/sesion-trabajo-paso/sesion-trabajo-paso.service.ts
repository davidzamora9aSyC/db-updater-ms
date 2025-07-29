import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SesionTrabajoPaso,
  EstadoSesionTrabajoPaso,
} from './sesion-trabajo-paso.entity';
import { CreateSesionTrabajoPasoDto } from './dto/create-sesion-trabajo-paso.dto';
import { UpdateSesionTrabajoPasoDto } from './dto/update-sesion-trabajo-paso.dto';

@Injectable()
export class SesionTrabajoPasoService {
  constructor(
    @InjectRepository(SesionTrabajoPaso)
    private readonly repo: Repository<SesionTrabajoPaso>,
  ) {}

  create(dto: CreateSesionTrabajoPasoDto) {
    const entity = this.repo.create({
      sesionTrabajo: { id: dto.sesionTrabajo } as any,
      pasoOrden: { id: dto.pasoOrden } as any,
      cantidadAsignada: dto.cantidadAsignada,
      cantidadProducida: dto.cantidadProducida ?? 0,
      estado: dto.estado ?? EstadoSesionTrabajoPaso.PAUSADO,
    });
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({ relations: ['sesionTrabajo', 'pasoOrden'] });
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['sesionTrabajo', 'pasoOrden'],
    });
    if (!entity) throw new NotFoundException('Relación no encontrada');
    return entity;
  }

  async update(id: string, dto: UpdateSesionTrabajoPasoDto) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Relación no encontrada');
    if (dto.sesionTrabajo)
      entity.sesionTrabajo = { id: dto.sesionTrabajo } as any;
    if (dto.pasoOrden) entity.pasoOrden = { id: dto.pasoOrden } as any;
    if (dto.cantidadAsignada !== undefined)
      entity.cantidadAsignada = dto.cantidadAsignada;
    if (dto.cantidadProducida !== undefined)
      entity.cantidadProducida = dto.cantidadProducida;
    if (dto.estado) entity.estado = dto.estado;
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Relación no encontrada');
    await this.repo.remove(entity);
    return { deleted: true };
  }
  findByPaso(pasoId: string) {
    return this.repo.find({
      where: { pasoOrden: { id: pasoId } },
      relations: ['sesionTrabajo', 'pasoOrden'],
    });
  }

  findBySesion(sesionId: string) {
    return this.repo.find({
      where: { sesionTrabajo: { id: sesionId } },
      relations: ['sesionTrabajo', 'pasoOrden'],
    });
  }

  async removeByPaso(pasoId: string) {
    const relaciones = await this.repo.find({
      where: { pasoOrden: { id: pasoId } },
    });
    await this.repo.remove(relaciones);
    return { deleted: true, count: relaciones.length };
  }

  async removeBySesion(sesionId: string) {
    const relaciones = await this.repo.find({
      where: { sesionTrabajo: { id: sesionId } },
    });
    await this.repo.remove(relaciones);
    return { deleted: true, count: relaciones.length };
  }
}
