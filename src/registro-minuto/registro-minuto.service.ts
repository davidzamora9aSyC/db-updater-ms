import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RegistroMinuto } from './registro-minuto.schema'
import { CreateRegistroMinutoDto } from './dto/create-registro-minuto.dto'

@Injectable()
export class RegistroMinutoService {
  private memoria: Map<string, { cantidad: number; pedalazos: number }> = new Map()

  constructor(@InjectModel(RegistroMinuto.name) private model: Model<RegistroMinuto>) {}

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

    if (registros.length > 0) await this.model.insertMany(registros)

    this.memoria.clear()
  }
}