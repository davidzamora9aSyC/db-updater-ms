import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { CreateTrabajadorDto } from './dto/create-trabajador.dto'
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto'
import { Trabajador } from './trabajador.entity'
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity'
import { EstadoSesion } from '../estado-sesion/estado-sesion.entity'
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity'

@Injectable()
export class TrabajadorService {
  constructor(
    @InjectRepository(Trabajador)
    private readonly repo: Repository<Trabajador>,
    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    @InjectRepository(EstadoSesion)
    private readonly estadoSesionRepo: Repository<EstadoSesion>,
    @InjectRepository(EstadoTrabajador)
    private readonly estadoTrabRepo: Repository<EstadoTrabajador>,
  ) {}

  async crear(data: CreateTrabajadorDto) {
    const existente = await this.repo.findOne({
      where: { identificacion: data.identificacion },
    })
    if (existente)
      throw new BadRequestException(
        'No se puede crear un trabajador con un id que ya existe',
      )
    const mismoNombre = await this.repo.findOne({ where: { nombre: data.nombre } })
    if (mismoNombre)
      throw new BadRequestException('Ya existe un trabajador con ese nombre')
    const nuevoTrabajador = this.repo.create(data)
    await this.repo.save(nuevoTrabajador)
    return { mensaje: 'Trabajador creado', data: nuevoTrabajador }
  }

  async listar() {
    const trabajadores = await this.repo.find()
    return Promise.all(
      trabajadores.map(async (t) => ({
        ...t,
        estado: await this.obtenerEstado(t.id),
      })),
    )
  }

  async buscar(opts: { q?: string; nombre?: string; identificacion?: string; limit?: number }) {
    const qb = this.repo.createQueryBuilder('t')
    const limit = Math.min(Math.max(opts.limit || 20, 1), 100)
    const whereParts: string[] = []
    const params: Record<string, any> = {}

    if (opts.q && opts.q.trim()) {
      whereParts.push('(LOWER(t.nombre) LIKE :q OR LOWER(t.identificacion) LIKE :q)')
      params.q = `%${opts.q.trim().toLowerCase()}%`
    }
    if (opts.nombre && opts.nombre.trim()) {
      whereParts.push('LOWER(t.nombre) LIKE :nombre')
      params.nombre = `%${opts.nombre.trim().toLowerCase()}%`
    }
    if (opts.identificacion && opts.identificacion.trim()) {
      whereParts.push('t.identificacion LIKE :identificacion')
      params.identificacion = `%${opts.identificacion.trim()}%`
    }

    if (whereParts.length > 0) qb.where(whereParts.join(' AND '), params)
    const rows = await qb.orderBy('t.nombre', 'ASC').take(limit).getMany()

    return Promise.all(
      rows.map(async (t) => ({
        ...t,
        estado: await this.obtenerEstado(t.id),
      })),
    )
  }

  async obtener(id: string) {
    const trabajador = await this.repo.findOneBy({ id })
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado')
    const estado = await this.obtenerEstado(id)
    return { ...trabajador, estado }
  }

  async actualizar(id: string, data: UpdateTrabajadorDto) {
    const trabajador = await this.repo.preload({ id, ...data })
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado')
    const mismoNombre = await this.repo.findOne({ where: { nombre: data.nombre } })
    if (mismoNombre && mismoNombre.id !== id)
      throw new BadRequestException('Ya existe un trabajador con ese nombre')
    try {
      await this.repo.save(trabajador)
    } catch (e) {
      if (e?.code === '23505') throw new BadRequestException('Identificación duplicada')
      throw e
    }
    return { mensaje: `Trabajador ${id} actualizado`, data: trabajador }
  }

  async eliminar(id: string) {
    const trabajador = await this.repo.findOneBy({ id })
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado')
    await this.repo.remove(trabajador)
    return { mensaje: `Trabajador ${id} eliminado` }
  }

  private async obtenerEstado(trabajadorId: string): Promise<string> {
    const sesion = await this.sesionRepo.findOne({
      where: { trabajador: { id: trabajadorId }, fechaFin: IsNull() },
      order: { fechaInicio: 'DESC' },
    })
    if (sesion) {
      const estadoSesion = await this.estadoSesionRepo.findOne({
        where: { sesionTrabajo: { id: sesion.id } },
        order: { inicio: 'DESC' },
      })
      return estadoSesion?.estado ?? 'inactivo'
    }
    const estadoTrab = await this.estadoTrabRepo.findOne({
      where: {
        trabajador: { id: trabajadorId },
        fin: IsNull(),
        descanso: true,
      },
    })
    if (estadoTrab) return 'descanso'
    return 'inactivo'
  }
}
