import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RegistroMinuto } from './registro-minuto.entity'
import { CreateRegistroMinutoDto } from './dto/create-registro-minuto.dto'
import { Mutex } from 'async-mutex'


@Injectable()
export class RegistroMinutoService {
  private memoria: Map<string, { pedaleadas: number; piezasContadas: number }> = new Map()
  private mutex = new Mutex()

  constructor(
    @InjectRepository(RegistroMinuto)
    private readonly repo: Repository<RegistroMinuto>,
  ) {}

  async acumular(sesionTrabajoId: string, tipo: 'pedal' | 'pieza', minutoInicio: string) {
  await this.mutex.runExclusive(() => {
    const clave = `${sesionTrabajoId}_${minutoInicio}`
    const actual = this.memoria.get(clave) || { pedaleadas: 0, piezasContadas: 0 }

    if (tipo === 'pedal') actual.pedaleadas += 1
    if (tipo === 'pieza') actual.piezasContadas += 1

    this.memoria.set(clave, actual)
  })
}

  async guardarYLimpiar() {
    await this.mutex.runExclusive(async () => {
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
    })
  }

  @Cron('* * * * *')
  handleCron() {
    this.guardarYLimpiar()
  }

  async obtenerPorSesion(sesionTrabajoId: string): Promise<RegistroMinuto[]> {
    return this.repo.find({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
      order: { minutoInicio: 'ASC' }
    })
  }
}