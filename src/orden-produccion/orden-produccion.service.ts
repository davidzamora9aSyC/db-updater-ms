import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { OrdenProduccion, OrdenProduccionDocument } from './schema'
import { CrearOrdenDto } from './dto/crear-orden.dto'
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto'

@Injectable()
export class OrdenProduccionService {
  constructor(@InjectModel(OrdenProduccion.name) private model: Model<OrdenProduccionDocument>) {}

  crear(dto: CrearOrdenDto) {
    return this.model.create(dto)
  }

  obtenerTodas() {
    return this.model.find()
  }

  async obtenerPorId(id: string) {
    const orden = await this.model.findById(id)
    if (!orden) throw new NotFoundException('Orden no encontrada')
    return orden
  }

  async obtenerPasos(id: string) {
    const orden = await this.model.findById(id).populate('pasos')
    if (!orden) throw new NotFoundException('Orden no encontrada')
    return orden.pasos
  }

  async actualizarProgreso(id: string, dto: ActualizarProgresoDto) {
    const orden = await this.model.findById(id)
    if (!orden) throw new NotFoundException('Orden no encontrada')
    orden.progreso = dto.progreso
    return orden.save()
  }
}