import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Recurso } from './recurso.entity'

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
}