import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Recurso } from './recurso.entity'
import { Trabajador } from '../trabajador/trabajador.entity';

@Injectable()
export class RecursoService {
  constructor(
    @InjectRepository(Recurso)
    private readonly repo: Repository<Recurso>,
    @InjectRepository(Trabajador)
    private readonly trabajadorRepo: Repository<Trabajador>,
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
  async create(data: Partial<Recurso>) {
    const recurso = this.repo.create(data)
    return this.repo.save(recurso)
  }

  async update(id: string, data: Partial<Recurso>) {
    let trabajadorEntity = undefined;
    if (typeof data.trabajador === 'string') {
      trabajadorEntity = await this.trabajadorRepo.findOneBy({ id: data.trabajador });
      if (!trabajadorEntity) throw new NotFoundException('Trabajador no encontrado');
    }

    const recurso = await this.repo.preload({
      id,
      ...data,
      trabajador: trabajadorEntity ?? data.trabajador,
    });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    return this.repo.save(recurso);
  }

  async remove(id: string) {
    const recurso = await this.repo.findOneBy({ id })
    if (!recurso) throw new NotFoundException('Recurso no encontrado')
    return this.repo.remove(recurso)
  }
}