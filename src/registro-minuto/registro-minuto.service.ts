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

  acumular(sesionTrabajoId: string, pedaleadas: number, piezasContadas: number, minutoInicio: string) {
    const clave = `${sesionTrabajoId}_${minutoInicio}`
    const actual = this.memoria.get(clave) || { pedaleadas: 0, piezasContadas: 0 }
    actual.pedaleadas += pedaleadas
    actual.piezasContadas += piezasContadas
    this.memoria.set(clave, actual)
  }

  async guardarYLimpiar() {
    const registros: CreateRegistroMinutoDto[] = []

    for (const [clave, data] of this.memoria.entries()) {
      const [sesionTrabajo, minutoInicio] = clave.split('_')
      registros.push({
        sesionTrabajo,
        minutoInicio: new Date(minutoInicio).toISOString(),
        ...data
      })
    }

    if (registros.length > 0) {
      const entidades = registros.map(dto => ({
        ...dto,
        minutoInicio: new Date(dto.minutoInicio),
        sesionTrabajo: { id: dto.sesionTrabajo },
      }))
      await this.repo.save(entidades)
    }

    this.memoria.clear()
  }
}