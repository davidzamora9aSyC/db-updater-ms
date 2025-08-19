import { validate as isUUID } from 'uuid';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { OrdenProduccion, EstadoOrdenProduccion } from './entity';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { ActualizarOrdenDto } from './dto/actualizar-orden.dto';
import {
  PasoProduccion,
  EstadoPasoOrden,
} from '../paso-produccion/paso-produccion.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { Maquina } from '../maquina/maquina.entity';
import {
  EstadoSesion,
  TipoEstadoSesion,
} from '../estado-sesion/estado-sesion.entity';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';
import { SesionTrabajoPasoDto } from '../sesion-trabajo-paso/dto/sesion-trabajo-paso.dto';

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

    if (pasos?.length) {
      pasos.forEach((p, i) => {
        if (
          p == null ||
          p.numeroPaso == null ||
          Number.isNaN(Number(p.numeroPaso))
        ) {
          throw new BadRequestException(
            `Paso ${i + 1}: 'numeroPaso' es requerido y debe ser numérico`,
          );
        }
      });
    }

    const existente = await this.repo.findOne({ where: { numero } });
    if (existente)
      throw new ConflictException('Ya existe una orden con ese número');

    try {
      const nueva = this.repo.create({
        ...datosOrden,
        numero,
        estado: EstadoOrdenProduccion.PENDIENTE,
      });
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
    } catch (e) {
      const err = e as { code?: string; detail?: string };
      const code = err.code;
      const detail = err.detail ?? (e instanceof Error ? e.message : String(e));
      if (code === '23502') {
        throw new BadRequestException(
          `Violación NOT NULL al crear la orden/pasos: ${detail}`,
        );
      }
      if (code === '23505') {
        throw new ConflictException(detail || 'Duplicado');
      }
      throw new BadRequestException(detail);
    }
  }

  private async withCantidadProducida(orden: OrdenProduccion) {
    const raw = await this.pasoRepo
      .createQueryBuilder('p')
      .leftJoin('p.orden', 'o')
      .select('COALESCE(SUM(p.cantidadProducida),0)', 'suma')
      .where('o.id = :id', { id: orden.id })
      .getRawOne();
    if (!raw) {
      throw new Error('No se pudo obtener la suma de cantidadProducida');
    }
    const cantidad = Number(raw.suma);
    return { ...orden, cantidadProducida: cantidad } as OrdenProduccion & {
      cantidadProducida: number;
    };
  }

  private async withCantidadProducidaMany(ordenes: OrdenProduccion[]) {
    const ids = ordenes.map((o) => o.id);
    if (!ids.length)
      return [] as (OrdenProduccion & { cantidadProducida: number })[];
    const raws: { ordenId: string; suma: number }[] = await this.pasoRepo
      .createQueryBuilder('p')
      .leftJoin('p.orden', 'o')
      .select('o.id', 'ordenId')
      .addSelect('COALESCE(SUM(p.cantidadProducida),0)', 'suma')
      .where('o.id IN (:...ids)', { ids })
      .groupBy('o.id')
      .getRawMany();
    const map = new Map<string, number>(
      raws.map((r) => [r.ordenId, Number(r.suma)]),
    );
    return ordenes.map((o) => ({
      ...o,
      cantidadProducida: map.get(o.id) ?? 0,
    })) as (OrdenProduccion & { cantidadProducida: number })[];
  }

  private async mapEstado(
    entity: SesionTrabajoPaso,
  ): Promise<SesionTrabajoPasoDto> {
    const estadoSesionRepo = this.stpRepo.manager.getRepository(EstadoSesion);
    const estadoSesion = await estadoSesionRepo.findOne({
      where: { sesionTrabajo: { id: entity.sesionTrabajo.id }, fin: IsNull() },
      order: { inicio: 'DESC' },
    });

    if (entity.sesionTrabajo.fechaFin) {
      return { ...entity, estado: 'finalizada' };
    }

    let estado: string = estadoSesion?.estado || TipoEstadoSesion.OTRO;

    if (estadoSesion?.estado === TipoEstadoSesion.OTRO) {
      const estadoTrabRepo =
        this.stpRepo.manager.getRepository(EstadoTrabajador);
      const estadoTrab = await estadoTrabRepo.findOne({
        where: {
          trabajador: { id: entity.sesionTrabajo.trabajador?.id },
          fin: IsNull(),
        },
        order: { inicio: 'DESC' },
      });
      if (estadoTrab?.descanso) {
        estado = 'descanso';
      } else {
        const estadoMaqRepo = this.stpRepo.manager.getRepository(EstadoMaquina);
        const estadoMaq = await estadoMaqRepo.findOne({
          where: {
            maquina: { id: entity.sesionTrabajo.maquina?.id },
            fin: IsNull(),
          },
          order: { inicio: 'DESC' },
        });
        if (estadoMaq?.mantenimiento) {
          estado = 'mantenimiento';
        }
      }
    }

    return { ...entity, estado } as SesionTrabajoPasoDto;
  }

  async obtenerTodas() {
    const ordenes = await this.repo.find();
    return this.withCantidadProducidaMany(ordenes);
  }

  async obtenerPorId(id: string) {
    const orden = await this.repo.findOne({ where: { id } });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    return this.withCantidadProducida(orden);
  }

  async obtenerDetalle(id: string) {
    if (!isUUID(id)) throw new BadRequestException('ID inválido');
    const orden = await this.repo.findOne({ where: { id } });
    if (!orden) throw new NotFoundException('Orden no encontrada');

    const pasos = await this.pasoRepo.find({
      where: { orden: { id } },
      order: { numeroPaso: 'ASC' },
    });

    const pasosDetallados = [] as (PasoProduccion & {
      sesiones: SesionTrabajoPasoDto[];
    })[];
    for (const paso of pasos) {
      const relaciones = await this.stpRepo.find({
        where: { pasoOrden: { id: paso.id } },
        relations: [
          'sesionTrabajo',
          'sesionTrabajo.trabajador',
          'sesionTrabajo.maquina',
          'pasoOrden',
        ],
      });
      const stp = await Promise.all(relaciones.map((r) => this.mapEstado(r)));
      pasosDetallados.push({ ...paso, sesiones: stp });
    }

    const ordenConCantidad = await this.withCantidadProducida(orden);
    return { ...ordenConCantidad, pasos: pasosDetallados };
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
    const ordenes = await this.repo.find({
      where: { estado: EstadoOrdenProduccion.FINALIZADA },
    });
    return this.withCantidadProducidaMany(ordenes);
  }

  async obtenerNoFinalizadas() {
    const ordenes = await this.repo.find({
      where: { estado: Not(EstadoOrdenProduccion.FINALIZADA) },
    });
    return this.withCantidadProducidaMany(ordenes);
  }

  async eliminar(id: string) {
    const orden = await this.repo.findOne({ where: { id } });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    await this.repo.remove(orden);
    return { deleted: true };
  }
}
