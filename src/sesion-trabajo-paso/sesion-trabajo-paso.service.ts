import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SesionTrabajoPaso,
  EstadoSesionTrabajoPaso,
} from './sesion-trabajo-paso.entity';
import { PasoProduccion, EstadoPasoOrden } from '../paso-produccion/paso-produccion.entity';
import { OrdenProduccion, EstadoOrdenProduccion } from '../orden-produccion/entity';
import { CreateSesionTrabajoPasoDto } from './dto/create-sesion-trabajo-paso.dto';
import { UpdateSesionTrabajoPasoDto } from './dto/update-sesion-trabajo-paso.dto';

@Injectable()
export class SesionTrabajoPasoService {
  constructor(
    @InjectRepository(SesionTrabajoPaso)
    private readonly repo: Repository<SesionTrabajoPaso>,
  ) {}

  async create(dto: CreateSesionTrabajoPasoDto) {
    const activos = await this.repo.find({
      where: { sesionTrabajo: { id: dto.sesionTrabajo }, estado: EstadoSesionTrabajoPaso.ACTIVO },
    });
    for (const a of activos) {
      a.estado = EstadoSesionTrabajoPaso.PAUSADO;
      await this.repo.save(a);
    }

    const entity = this.repo.create({
      sesionTrabajo: { id: dto.sesionTrabajo } as any,
      pasoOrden: { id: dto.pasoOrden } as any,
      cantidadAsignada: dto.cantidadAsignada,
      cantidadProducida: dto.cantidadProducida ?? 0,
      estado: EstadoSesionTrabajoPaso.ACTIVO,
    });
    const saved = await this.repo.save(entity);

    const pasoRepo = this.repo.manager.getRepository(PasoProduccion);
    const ordenRepo = this.repo.manager.getRepository(OrdenProduccion);
    const paso = await pasoRepo.findOne({ where: { id: dto.pasoOrden }, relations: ['orden'] });
    if (paso && paso.estado === EstadoPasoOrden.PENDIENTE) {
      paso.estado = EstadoPasoOrden.ACTIVO;
      await pasoRepo.save(paso);
      const orden = await ordenRepo.findOne({ where: { id: paso.orden.id } });
      if (orden && orden.estado === EstadoOrdenProduccion.PENDIENTE) {
        orden.estado = EstadoOrdenProduccion.ACTIVA;
        await ordenRepo.save(orden);
      }
    }

    await this.verificarPaso(saved.pasoOrden.id);

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
    if (dto.sesionTrabajo)
      entity.sesionTrabajo = { id: dto.sesionTrabajo } as any;
    if (dto.pasoOrden) entity.pasoOrden = { id: dto.pasoOrden } as any;
    if (dto.cantidadAsignada !== undefined)
      entity.cantidadAsignada = dto.cantidadAsignada;
    if (dto.cantidadProducida !== undefined)
      entity.cantidadProducida = dto.cantidadProducida;
    if (dto.estado) entity.estado = dto.estado;
    if (
      entity.cantidadProducida >= entity.cantidadAsignada &&
      entity.estado !== EstadoSesionTrabajoPaso.FINALIZADO
    ) {
      entity.estado = EstadoSesionTrabajoPaso.FINALIZADO;
    }
    const saved = await this.repo.save(entity);
    await this.verificarPaso(saved.pasoOrden.id);
    return saved;
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

  private async verificarPaso(pasoId: string) {
    const pasoRepo = this.repo.manager.getRepository(PasoProduccion);
    const ordenRepo = this.repo.manager.getRepository(OrdenProduccion);
    const paso = await pasoRepo.findOne({ where: { id: pasoId }, relations: ['orden'] });
    if (!paso) return;
    const relaciones = await this.repo.find({ where: { pasoOrden: { id: pasoId } } });
    const total = relaciones.reduce((s, r) => s + r.cantidadProducida, 0);
    const allFin = relaciones.every((r) => r.estado === EstadoSesionTrabajoPaso.FINALIZADO);
    const anyActivo = relaciones.some((r) => r.estado === EstadoSesionTrabajoPaso.ACTIVO);
    const allPausado =
      relaciones.length > 0 &&
      relaciones.every((r) => r.estado === EstadoSesionTrabajoPaso.PAUSADO);

    let nuevoEstado = paso.estado;
    if (allFin || total >= paso.cantidadRequerida) {
      nuevoEstado = EstadoPasoOrden.FINALIZADO;
    } else if (allPausado) {
      nuevoEstado = EstadoPasoOrden.PAUSADO;
    } else if (anyActivo) {
      nuevoEstado = EstadoPasoOrden.ACTIVO;
    }

    if (nuevoEstado !== paso.estado) {
      paso.estado = nuevoEstado;
      await pasoRepo.save(paso);
      await this.verificarOrden(paso.orden.id);
    }
  }

  private async verificarOrden(ordenId: string) {
    const ordenRepo = this.repo.manager.getRepository(OrdenProduccion);
    const pasoRepo = this.repo.manager.getRepository(PasoProduccion);
    const pasos = await pasoRepo.find({ where: { orden: { id: ordenId } } });
    if (!pasos.length) return;
    const allFin = pasos.every((p) => p.estado === EstadoPasoOrden.FINALIZADO);
    const allPause = pasos.every((p) => p.estado === EstadoPasoOrden.PAUSADO);
    const anyActivo = pasos.some((p) => p.estado === EstadoPasoOrden.ACTIVO);

    const orden = await ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) return;
    let nuevo = orden.estado;
    if (allFin) {
      nuevo = EstadoOrdenProduccion.FINALIZADA;
    } else if (allPause) {
      nuevo = EstadoOrdenProduccion.PAUSADA;
    } else if (anyActivo) {
      nuevo = EstadoOrdenProduccion.ACTIVA;
    }

    if (nuevo !== orden.estado) {
      orden.estado = nuevo;
      await ordenRepo.save(orden);
    }
  }
}
