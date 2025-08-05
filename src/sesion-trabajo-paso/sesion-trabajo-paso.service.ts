import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionTrabajoPaso } from './sesion-trabajo-paso.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import {
  PasoProduccion,
  EstadoPasoOrden,
} from '../paso-produccion/paso-produccion.entity';
import {
  OrdenProduccion,
  EstadoOrdenProduccion,
} from '../orden-produccion/entity';
import { CreateSesionTrabajoPasoDto } from './dto/create-sesion-trabajo-paso.dto';
import { UpdateSesionTrabajoPasoDto } from './dto/update-sesion-trabajo-paso.dto';

@Injectable()
export class SesionTrabajoPasoService {
  constructor(
    @InjectRepository(SesionTrabajoPaso)
    private readonly repo: Repository<SesionTrabajoPaso>,
  ) {}

  async create(dto: CreateSesionTrabajoPasoDto) {
    const entity = this.repo.create({
      sesionTrabajo: { id: dto.sesionTrabajo } as any,
      pasoOrden: { id: dto.pasoOrden } as any,
      cantidadAsignada: dto.cantidadAsignada,
      cantidadProducida: dto.cantidadProducida ?? 0,
      cantidadPedaleos: dto.cantidadPedaleos ?? 0,
    });

    const sesionRepo = this.repo.manager.getRepository(SesionTrabajo);
    const sesion = await sesionRepo.findOne({
      where: { id: dto.sesionTrabajo },
      relations: ['trabajador', 'maquina'],
    });
    if (sesion) {
      entity.nombreTrabajador = sesion.trabajador?.nombre ?? '';
      if (!entity.nombreTrabajador)
        console.warn(
          '⚠️ nombreTrabajador no encontrado para sesión',
          dto.sesionTrabajo,
        );
      entity.nombreMaquina = sesion.maquina?.nombre ?? '';
      if (!entity.nombreMaquina)
        console.warn(
          '⚠️ nombreMaquina no encontrado para sesión',
          dto.sesionTrabajo,
        );
    }

    const saved = await this.repo.save(entity);

    const pasoRepo = this.repo.manager.getRepository(PasoProduccion);
    const ordenRepo = this.repo.manager.getRepository(OrdenProduccion);
    const paso = await pasoRepo.findOne({
      where: { id: dto.pasoOrden },
      relations: ['orden'],
    });
    if (paso && paso.estado === EstadoPasoOrden.PENDIENTE) {
      paso.estado = EstadoPasoOrden.ACTIVO;
      await pasoRepo.save(paso);
      const orden = await ordenRepo.findOne({ where: { id: paso.orden.id } });
      if (orden && orden.estado === EstadoOrdenProduccion.PENDIENTE) {
        orden.estado = EstadoOrdenProduccion.ACTIVA;
        await ordenRepo.save(orden);
      }
    }

    return saved;
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
    if (dto.sesionTrabajo) {
      const sesionRepo = this.repo.manager.getRepository(SesionTrabajo);
      const sesion = await sesionRepo.findOne({
        where: { id: dto.sesionTrabajo },
        relations: ['trabajador', 'maquina'],
      });
      if (sesion) {
        entity.sesionTrabajo = sesion;
        entity.nombreTrabajador = sesion.trabajador?.nombre || 'Desconocido';
        entity.nombreMaquina = sesion.maquina?.nombre || 'Desconocido';
      } else {
        entity.sesionTrabajo = { id: dto.sesionTrabajo } as any;
        entity.nombreTrabajador = 'Desconocido';
        entity.nombreMaquina = 'Desconocido';
      }
    }
    if (dto.pasoOrden) entity.pasoOrden = { id: dto.pasoOrden } as any;
    if (dto.cantidadAsignada !== undefined)
      entity.cantidadAsignada = dto.cantidadAsignada;
    if (dto.cantidadProducida !== undefined)
      entity.cantidadProducida = dto.cantidadProducida;
    if (dto.cantidadPedaleos !== undefined)
      entity.cantidadPedaleos = dto.cantidadPedaleos;
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
