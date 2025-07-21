import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Recurso } from './recurso.entity'
import { Maquina } from '../maquina/maquina.entity'
import { Trabajador } from '../trabajador/trabajador.entity'
import { CreateRecursoDto } from './dto/create-recurso.dto'
import { UpdateRecursoDto } from './dto/update-recurso.dto'

@Injectable()
export class RecursoService {
  constructor(
    @InjectRepository(Recurso)
    private readonly repo: Repository<Recurso>,
  ) {}

  async findAll() {
    return this.repo.find({ relations: ['trabajador', 'maquina'] })
  }

  async findActuales() {
    return this.repo.find({
      where: { activo: true },
      relations: ['trabajador', 'maquina'],
    })
  }

  async findOne(id: string) {
    const recurso = await this.repo.findOne({
      where: { id },
      relations: ['trabajador', 'maquina'],
    })
    if (!recurso) throw new NotFoundException('Recurso no encontrado')
    return recurso
  }

  async toggleEstado(id: string) {
    const recurso = await this.repo.findOneBy({ id })
    if (!recurso) throw new NotFoundException('Recurso no encontrado')
    recurso.activo = !recurso.activo
    return this.repo.save(recurso)
  }
  async create(dto: CreateRecursoDto) {
    const recurso = this.repo.create({
      trabajador: { id: dto.trabajador } as Trabajador,
      maquina: { id: dto.maquina } as Maquina,
    })
    return this.repo.save(recurso)
  }

  async update(id: string, dto: UpdateRecursoDto) {
    const recurso = await this.repo.findOne({ where: { id } })
    if (!recurso) throw new NotFoundException('Recurso no encontrado')
    if (dto.trabajador) recurso.trabajador = { id: dto.trabajador } as Trabajador
    if (dto.maquina) recurso.maquina = { id: dto.maquina } as Maquina
    if (dto.activo !== undefined) recurso.activo = dto.activo
    return this.repo.save(recurso)
  }

  async remove(id: string) {
    const recurso = await this.repo.findOneBy({ id })
    if (!recurso) throw new NotFoundException('Recurso no encontrado')
    return this.repo.remove(recurso)
  }
}