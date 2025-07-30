import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OrdenProduccion, EstadoOrdenProduccion } from './entity'
import { CrearOrdenDto } from './dto/crear-orden.dto'
import { ActualizarOrdenDto } from './dto/actualizar-orden.dto'
import { PasoOrdenDto } from './dto/paso-orden.dto'
import { PasoProduccion, EstadoPasoOrden } from '../paso-produccion/paso-produccion.entity'
import {
  SesionTrabajo,
  EstadoSesionTrabajo,
} from '../sesion-trabajo/sesion-trabajo.entity'
import {
  SesionTrabajoPaso,
  EstadoSesionTrabajoPaso,
} from '../sesion-trabajo-paso/sesion-trabajo-paso.entity'
import { Maquina } from '../maquina/maquina.entity'

@Injectable()
export class OrdenProduccionService {
  constructor(
    @InjectRepository(OrdenProduccion)
    private readonly repo: Repository<OrdenProduccion>,
    @InjectRepository(PasoProduccion)
    private readonly pasoRepo: Repository<PasoProduccion>,
    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    @InjectRepository(SesionTrabajoPaso)
    private readonly stpRepo: Repository<SesionTrabajoPaso>,
    @InjectRepository(Maquina)
    private readonly maquinaRepo: Repository<Maquina>,
  ) {}

  async crear(dto: CrearOrdenDto) {
    const { pasos, numero, ...datosOrden } = dto;

    const existente = await this.repo.findOne({ where: { numero } });
    if (existente) throw new NotFoundException('Ya existe una orden con ese número');


    const nueva = this.repo.create({ ...datosOrden, numero });
    const orden = await this.repo.save(nueva);

    if (pasos?.length) {
      for (const pasoDto of pasos) {
        const paso = this.pasoRepo.create({
          ...pasoDto,
          cantidadProducida: pasoDto.cantidadProducida ?? 0,
          cantidadPedaleos: pasoDto.cantidadPedaleos ?? 0,
          estado: pasoDto.estado ?? EstadoPasoOrden.PENDIENTE,
          orden,
        });
        await this.pasoRepo.save(paso);
      }
    }

    return orden;
  }

  obtenerTodas() {
    return this.repo.find()
  }

  async obtenerPorId(id: string) {
    const orden = await this.repo.findOne({ where: { id } })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    return orden
  }

  async actualizar(id: string, dto: ActualizarOrdenDto) {
    const { pasos, maquina, ...datosOrden } = dto;
    const orden = await this.repo.preload({ id, ...datosOrden });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    await this.repo.save(orden);

    if (pasos) {
      const antiguos = await this.pasoRepo.find({ where: { orden: { id } } });
      for (const p of antiguos) {
        await this.stpRepo.delete({ pasoOrden: { id: p.id } });
      }
      await this.pasoRepo.remove(antiguos);

      let sesion: SesionTrabajo | undefined = undefined;
      if (maquina) {
        const maquinaEntity = await this.maquinaRepo.findOne({
          where: { id: maquina },
        });
        if (!maquinaEntity) throw new NotFoundException('Máquina no encontrada');

        let sesion: SesionTrabajo | null = await this.sesionRepo.findOne({
          where: {
            maquina: { id: maquina },
            estado: EstadoSesionTrabajo.ACTIVA,
          },
        });
        if (!sesion) throw new NotFoundException('No existe una sesión activa para esa máquina');
        
        if (!sesion)
          throw new NotFoundException('No existe una sesión activa para esa máquina');
      }

      for (const pasoDto of pasos) {
        const paso = this.pasoRepo.create({
          ...pasoDto,
          cantidadProducida: pasoDto.cantidadProducida ?? 0,
          cantidadPedaleos: pasoDto.cantidadPedaleos ?? 0,
          estado: pasoDto.estado ?? EstadoPasoOrden.PENDIENTE,
          orden,
        });
        const pasoGuardado = await this.pasoRepo.save(paso);

        if (sesion) {
          const relacion = this.stpRepo.create({
            sesionTrabajo: sesion,
            pasoOrden: pasoGuardado,
            cantidadAsignada: pasoGuardado.cantidadRequerida,
            cantidadProducida: 0,
            cantidadPedaleos: 0,
            estado: EstadoSesionTrabajoPaso.ACTIVO,
          });
          await this.stpRepo.save(relacion);
        }
      }
    }

    return orden;
  }

  async eliminar(id: string) {
    const orden = await this.repo.findOne({ where: { id } })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    await this.repo.remove(orden)
    return { deleted: true }
  }
}