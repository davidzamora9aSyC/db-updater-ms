import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PasoProduccion, EstadoPasoOrden } from './paso-produccion.entity'
import { OrdenProduccion, EstadoOrdenProduccion } from '../orden-produccion/entity'
import { CreatePasoProduccionDto } from './dto/create-paso-produccion.dto'
import { UpdatePasoProduccionDto } from './dto/update-paso-produccion.dto'
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity'
import { EstadoSesion, TipoEstadoSesion } from '../estado-sesion/estado-sesion.entity'

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

  async actualizarEstadoPorSesion(sesionId: string) {
    const stpRepo = this.repo.manager.getRepository(SesionTrabajoPaso)
    const relaciones = await stpRepo.find({
      where: { sesionTrabajo: { id: sesionId } },
      relations: ['pasoOrden'],
    })
    const pasosIds = Array.from(new Set(relaciones.map((r) => r.pasoOrden.id)))
    for (const pasoId of pasosIds) {
      await this.verificarSesiones(pasoId)
    }
  }

  private async verificarSesiones(pasoId: string) {
    const stpRepo = this.repo.manager.getRepository(SesionTrabajoPaso)
    const estadoRepo = this.repo.manager.getRepository(EstadoSesion)
    const paso = await this.repo.findOne({
      where: { id: pasoId },
      relations: ['orden'],
    })
    if (!paso || paso.estado === EstadoPasoOrden.FINALIZADO) return

    const relaciones = await stpRepo.find({
      where: { pasoOrden: { id: pasoId } },
      relations: ['sesionTrabajo'],
    })
    const sesiones = relaciones
      .map((r) => r.sesionTrabajo)
      .filter((s) => !s.fechaFin)

    let anyProd = false
    for (const sesion of sesiones) {
      const ultimo = await estadoRepo.findOne({
        where: { sesionTrabajo: { id: sesion.id } },
        order: { inicio: 'DESC' },
      })
      if (ultimo?.estado === TipoEstadoSesion.PRODUCCION) {
        anyProd = true
        break
      }
    }

    const nuevoEstado = anyProd
      ? EstadoPasoOrden.ACTIVO
      : EstadoPasoOrden.PAUSADO
    if (paso.estado !== nuevoEstado) {
      paso.estado = nuevoEstado
      await this.repo.save(paso)
      await this.actualizarEstadoOrden(paso.orden.id)
    }
  }

  private async actualizarEstadoOrden(ordenId: string) {
    const pasos = await this.repo.find({ where: { orden: { id: ordenId } } })
    const allFin = pasos.every((p) => p.estado === EstadoPasoOrden.FINALIZADO)
    const anyPause = pasos.some((p) => p.estado === EstadoPasoOrden.PAUSADO)
    const ordenRepo = this.repo.manager.getRepository(OrdenProduccion)
    const orden = await ordenRepo.findOne({ where: { id: ordenId } })
    if (!orden) return
    if (allFin) {
      orden.estado = EstadoOrdenProduccion.FINALIZADA
    } else if (anyPause) {
      orden.estado = EstadoOrdenProduccion.PAUSADA
    } else {
      orden.estado = EstadoOrdenProduccion.ACTIVA
    }
    await ordenRepo.save(orden)
  }
}
