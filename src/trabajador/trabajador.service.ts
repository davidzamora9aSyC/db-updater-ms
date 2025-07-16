import { EstadoTrabajador } from './dto/update-trabajador.dto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateTrabajadorDto } from './dto/create-trabajador.dto'
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto'
import { Trabajador } from './trabajador.entity'

@Injectable()
export class TrabajadorService {
  constructor(
    @InjectRepository(Trabajador)
    private readonly repo: Repository<Trabajador>,
  ) {}

  async crear(data: CreateTrabajadorDto) {
    const nuevoTrabajador = this.repo.create(data)
    await this.repo.save(nuevoTrabajador)
    return { mensaje: 'Trabajador creado', data: nuevoTrabajador }
  }

  async listar() {
    return this.repo.find()
  }

  async obtener(id: string) {
    const trabajador = await this.repo.findOneBy({ id })
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado')
    return trabajador
  }

  async actualizar(id: string, data: UpdateTrabajadorDto) {
    const trabajador = await this.repo.preload({ id, ...data })
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado')
    await this.repo.save(trabajador)
    return { mensaje: `Trabajador ${id} actualizado`, data: trabajador }
  }

  async cambiarEstado(id: string, estado: EstadoTrabajador) {
    const trabajador = await this.repo.findOneBy({ id })
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado')
    trabajador.estado = estado
    await this.repo.save(trabajador)
    return { mensaje: `Estado de trabajador ${id} cambiado a ${estado}` }
  }
  async eliminar(id: string) {
    const trabajador = await this.repo.findOneBy({ id })
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado')
    await this.repo.remove(trabajador)
    return { mensaje: `Trabajador ${id} eliminado` }
  }
}