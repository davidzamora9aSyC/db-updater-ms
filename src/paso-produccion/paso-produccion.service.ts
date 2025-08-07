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
      cantidadProducida: 0,
      cantidadPedaleos: 0,
      estado: EstadoPasoOrden.PENDIENTE,
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
    for (const key of Object.keys(dto)) {
      if (key !== 'orden' && dto[key] !== undefined) {
        paso[key] = dto[key];
      }
    }
    const saved = await this.repo.save(paso);

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
      order: { numeroPaso: 'ASC' }
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
    const sesiones = relaciones.map((r) => r.sesionTrabajo)

    let anyProd = false

    const todasFinalizadas = sesiones.length > 0 && sesiones.every(s => s.fechaFin);
    if (todasFinalizadas) {
      paso.estado = EstadoPasoOrden.FINALIZADO;
      await this.repo.save(paso);
      await this.actualizarEstadoOrden(paso.orden.id);
      return;
    }

    const sesionesNoFinalizadas = sesiones.filter((s) => !s.fechaFin)
    for (const sesion of sesionesNoFinalizadas) {
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
    const allFinalizado = pasos.every(p => p.estado === EstadoPasoOrden.FINALIZADO)
    const allPausado = pasos.every(p => p.estado === EstadoPasoOrden.PAUSADO)
    const anyActivo = pasos.some(p => p.estado === EstadoPasoOrden.ACTIVO)

    const ordenRepo = this.repo.manager.getRepository(OrdenProduccion)
    const orden = await ordenRepo.findOne({ where: { id: ordenId } })
    if (!orden) return
    if (allFinalizado) {
      orden.estado = EstadoOrdenProduccion.FINALIZADA
    } else if (anyActivo) {
      orden.estado = EstadoOrdenProduccion.ACTIVA
    } else if (allPausado) {
      orden.estado = EstadoOrdenProduccion.PAUSADA
    }
    await ordenRepo.save(orden)
  }
}
