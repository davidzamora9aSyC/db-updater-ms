import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RegistroMinuto } from './registro-minuto.entity'
import { CreateRegistroMinutoDto } from './dto/create-registro-minuto.dto'

@Injectable()
export class RegistroMinutoService {
  private memoria: Map<string, { pedaleadas: number; piezasContadas: number }> = new Map()

  constructor(
    @InjectRepository(RegistroMinuto)
    private readonly repo: Repository<RegistroMinuto>,
  ) {}

  acumular(sesionTrabajoId: string, pedaleadas: number, piezasContadas: number) {
    const clave = sesionTrabajoId
    const actual = this.memoria.get(clave) || { pedaleadas: 0, piezasContadas: 0 }
    actual.pedaleadas += pedaleadas
    actual.piezasContadas += piezasContadas
    this.memoria.set(clave, actual)
  }

  async guardarYLimpiar() {
    const fecha = new Date()
    const registros: CreateRegistroMinutoDto[] = []

    for (const [sesionTrabajo, data] of this.memoria.entries()) {
      registros.push({ sesionTrabajo, ...data, minutoInicio: fecha })
    }

    if (registros.length > 0) await this.repo.save(registros)

    this.memoria.clear()
  }
}