import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Boton } from './boton.entity'

@Injectable()
export class BotonService {
  constructor(@InjectRepository(Boton) private readonly repo: Repository<Boton>) {}

  async registrarDescanso() {
    const boton = this.repo.create({ tipo: 'descanso', recursoId: 'recurso-x' })
    await this.repo.save(boton)
    return { mensaje: 'Descanso registrado' }
  }

  async registrarMantenimiento() {
    const boton = this.repo.create({ tipo: 'mantenimiento', recursoId: 'recurso-x' })
    await this.repo.save(boton)
    return { mensaje: 'Mantenimiento registrado' }
  }

  async registrarVolver() {
    const boton = this.repo.create({ tipo: 'volver', recursoId: 'recurso-x' })
    await this.repo.save(boton)
    return { mensaje: 'Volver registrado' }
  }
}