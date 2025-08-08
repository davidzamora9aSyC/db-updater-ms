import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Not } from 'typeorm'
import { OrdenProduccion, EstadoOrdenProduccion } from './entity'
import { CrearOrdenDto } from './dto/crear-orden.dto'
import { ActualizarOrdenDto } from './dto/actualizar-orden.dto'
import { PasoOrdenDto } from './dto/paso-orden.dto'
import { PasoProduccion, EstadoPasoOrden } from '../paso-produccion/paso-produccion.entity'
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity'
import { IsNull } from 'typeorm'
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity'
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
    if (existente) throw new ConflictException('Ya existe una orden con ese número');


    const nueva = this.repo.create({ ...datosOrden, numero, estado: EstadoOrdenProduccion.PENDIENTE });
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

  private async withCantidadProducida(orden: OrdenProduccion) {
    const raw = await this.pasoRepo
      .createQueryBuilder('p')
      .leftJoin('p.orden', 'o')
      .select('COALESCE(SUM(p.cantidadProducida),0)', 'suma')
      .where('o.id = :id', { id: orden.id })
      .getRawOne();
    const cantidad = Number(raw?.suma ?? 0);
    return { ...orden, cantidadProducida: cantidad } as OrdenProduccion & { cantidadProducida: number };
  }

  private async withCantidadProducidaMany(ordenes: OrdenProduccion[]) {
    const ids = ordenes.map(o => o.id);
    if (!ids.length) return [] as (OrdenProduccion & { cantidadProducida: number })[];
    const raws = await this.pasoRepo
      .createQueryBuilder('p')
      .leftJoin('p.orden', 'o')
      .select('o.id', 'ordenId')
      .addSelect('COALESCE(SUM(p.cantidadProducida),0)', 'suma')
      .where('o.id IN (:...ids)', { ids })
      .groupBy('o.id')
      .getRawMany();
    const map = new Map<string, number>(raws.map((r: any) => [r.ordenId, Number(r.suma)]));
    return ordenes.map(o => ({ ...o, cantidadProducida: map.get(o.id) ?? 0 })) as (OrdenProduccion & { cantidadProducida: number })[];
  }

  async obtenerTodas() {
    const ordenes = await this.repo.find();
    return this.withCantidadProducidaMany(ordenes);
  }

  async obtenerPorId(id: string) {
    const orden = await this.repo.findOne({ where: { id } })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    return this.withCantidadProducida(orden)
  }

  async actualizar(id: string, dto: ActualizarOrdenDto) {
    const existente = await this.repo.findOne({ where: { id } });
    if (!existente) throw new NotFoundException('Orden no encontrada');
  
    const datosCompletos = { ...existente, ...dto };
    const orden = this.repo.create({ ...datosCompletos, id }); 
    await this.repo.save(orden);
  
    return orden;
  }

  async obtenerFinalizadas() {
    const ordenes = await this.repo.find({ where: { estado: EstadoOrdenProduccion.FINALIZADA } });
    return this.withCantidadProducidaMany(ordenes);
  }

  async obtenerNoFinalizadas() {
    const ordenes = await this.repo.find({ where: { estado: Not(EstadoOrdenProduccion.FINALIZADA) } });
    return this.withCantidadProducidaMany(ordenes);
  }

  async eliminar(id: string) {
    const orden = await this.repo.findOne({ where: { id } })
    if (!orden) throw new NotFoundException('Orden no encontrada')
    await this.repo.remove(orden)
    return { deleted: true }
  }
}