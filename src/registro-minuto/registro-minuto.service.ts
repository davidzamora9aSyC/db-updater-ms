import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RegistroMinuto } from './registro-minuto.entity'
import { CreateRegistroMinutoDto } from './dto/create-registro-minuto.dto'

@Injectable()
export class RegistroMinutoService {
  private memoria: Map<string, { cantidad: number; pedalazos: number }> = new Map()

  constructor(
    @InjectRepository(RegistroMinuto)
    private readonly repo: Repository<RegistroMinuto>,
  ) {}

  acumular(recursoId: string, ordenId: string, pasoId: string, cantidad: number, pedalazos: number) {
    const clave = `${recursoId}-${ordenId}-${pasoId}`
    const actual = this.memoria.get(clave) || { cantidad: 0, pedalazos: 0 }
    actual.cantidad += cantidad
    actual.pedalazos += pedalazos
    this.memoria.set(clave, actual)
  }

  async guardarYLimpiar() {
    const fecha = new Date()
    const registros: CreateRegistroMinutoDto[] = []

    for (const [clave, data] of this.memoria.entries()) {
      const [recursoId, ordenId, pasoId] = clave.split('-')
      registros.push({ recursoId, ordenId, pasoId, ...data, timestamp: fecha })
    }

    if (registros.length > 0) await this.repo.save(registros)

    this.memoria.clear()
  }
}