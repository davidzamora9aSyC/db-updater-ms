import { EstadoTrabajador } from './dto/update-trabajador.dto'
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
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
    const existente = await this.repo.findOne({
      where: { identificacion: data.identificacion },
    })
    if (existente)
      throw new BadRequestException(
        'No se puede crear un trabajador con un id que ya existe',
      )
    const mismoNombre = await this.repo.findOne({ where: { nombre: data.nombre } })
    if (mismoNombre)
      throw new BadRequestException('Ya existe un trabajador con ese nombre')
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
    const mismoNombre = await this.repo.findOne({ where: { nombre: data.nombre } })
    if (mismoNombre && mismoNombre.id !== id)
      throw new BadRequestException('Ya existe un trabajador con ese nombre')
    try {
      await this.repo.save(trabajador)
    } catch (e) {
      if (e?.code === '23505') throw new BadRequestException('Identificación duplicada')
      throw e
    }
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