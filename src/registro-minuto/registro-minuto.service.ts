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
  ) { }

  async acumular(sesionTrabajoId: string, tipo: 'pedal' | 'pieza', minutoInicio: string) {
    const existe = await this.repo.manager
      .getRepository('sesion_trabajo')
      .createQueryBuilder('s')
      .select('s.id')
      .where('s.id = :id', { id: sesionTrabajoId })
      .getOne()

    if (!existe) return

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
  
      for (const dto of registros) {
        const sesionTrabajoId = dto.sesionTrabajo
        const minutoInicio = new Date(dto.minutoInicio)
  
        const existente = await this.repo.findOne({
          where: {
            sesionTrabajo: { id: sesionTrabajoId },
            minutoInicio
          }
        })
  
        const nuevoRegistro = this.repo.create({
          sesionTrabajo: { id: sesionTrabajoId },
          minutoInicio,
          pedaleadas: (existente?.pedaleadas || 0) + dto.pedaleadas,
          piezasContadas: (existente?.piezasContadas || 0) + dto.piezasContadas
        })
  
        await this.repo.save(nuevoRegistro)
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