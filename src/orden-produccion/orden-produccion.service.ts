import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OrdenProduccion } from './entity'
import { CrearOrdenDto } from './dto/crear-orden.dto'
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto'

@Injectable()
export class OrdenProduccionService {
  constructor(@InjectRepository(OrdenProduccion) private readonly repo: Repository<OrdenProduccion>) {}

  crear(dto: CrearOrdenDto) {
    const nueva = this.repo.create(dto)
    return this.repo.save(nueva)
  }

  obtenerTodas() {
    return this.repo.find()
  }

  async obtenerPorId(id: string) {
    const orden = await this.repo.findOne({ where: { id } })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    return orden
  }

  async obtenerPasos(id: string) {
    const orden = await this.repo.findOne({ where: { id } })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    return orden.pasos
  }

  async actualizarProgreso(id: string, dto: ActualizarProgresoDto) {
    const orden = await this.repo.findOne({ where: { id } })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    orden.progreso = dto.progreso
    return this.repo.save(orden)
  }
}