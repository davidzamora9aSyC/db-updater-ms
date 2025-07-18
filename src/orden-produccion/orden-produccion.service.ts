import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OrdenProduccion } from './entity'
import { CrearOrdenDto } from './dto/crear-orden.dto'
import { CrearOrdenDto as UpdateOrdenDto } from './dto/crear-orden.dto'

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

  async actualizar(id: string, dto: UpdateOrdenDto) {
    const orden = await this.repo.preload({ id, ...dto })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    return this.repo.save(orden)
  }

  async eliminar(id: string) {
    const orden = await this.repo.findOne({ where: { id } })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    await this.repo.remove(orden)
    return { deleted: true }
  }
}