import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DateTime } from 'luxon';
import { EstadoSesion } from './estado-sesion.entity';
import { CreateEstadoSesionDto } from './dto/create-estado-sesion.dto';
import { UpdateEstadoSesionDto } from './dto/update-estado-sesion.dto';
import { PasoProduccionService } from '../paso-produccion/paso-produccion.service';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';


@Injectable()
export class EstadoSesionService {
  constructor(
    @InjectRepository(EstadoSesion)
    private readonly repo: Repository<EstadoSesion>,
    private readonly pasoService: PasoProduccionService,
  ) {}

  async create(dto: CreateEstadoSesionDto) {
    const sesionRepo = this.repo.manager.getRepository(SesionTrabajo);
    const sesion = await sesionRepo.findOne({
      where: { id: dto.sesionTrabajo },
    });
    if (sesion?.fechaFin)
      throw new BadRequestException('La sesión ya finalizó');
    const nuevo = this.repo.create({
      ...dto,
      inicio: DateTime.fromJSDate(dto.inicio, {
        zone: 'America/Bogota',
      }).toJSDate(),
      fin: dto.fin
        ? DateTime.fromJSDate(dto.fin, { zone: 'America/Bogota' }).toJSDate()
        : null,
      sesionTrabajo: { id: dto.sesionTrabajo } as any,
    });
    const saved = await this.repo.save(nuevo);
    await this.pasoService.actualizarEstadoPorSesion(dto.sesionTrabajo);
    return saved;
  }

  async findAll() {
    const estados = await this.repo.find({
      relations: ['sesionTrabajo'],
      where: { fin: IsNull(), sesionTrabajo: { fechaFin: IsNull() } },
    });
    return estados;
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['sesionTrabajo'],
    });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    return estado;
  }

  async update(id: string, dto: UpdateEstadoSesionDto) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['sesionTrabajo'],
    });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    if (dto.sesionTrabajo)
      estado.sesionTrabajo = { id: dto.sesionTrabajo } as any;
    if (dto.inicio)
      estado.inicio = DateTime.fromJSDate(dto.inicio, {
        zone: 'America/Bogota',
      }).toJSDate();
    if (dto.fin)
      estado.fin = DateTime.fromJSDate(dto.fin, {
        zone: 'America/Bogota',
      }).toJSDate();
    Object.assign(estado, dto);
    const saved = await this.repo.save(estado);
    await this.pasoService.actualizarEstadoPorSesion(
      dto.sesionTrabajo ?? estado.sesionTrabajo.id,
    );
    return saved;
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de sesión no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }

  async findBySesion(sesionTrabajoId: string) {
    const estados = await this.repo.find({
      where: {
        sesionTrabajo: { id: sesionTrabajoId, fechaFin: IsNull() },
        fin: IsNull(),
      },
      relations: ['sesionTrabajo'],
      order: { inicio: 'DESC' },
    });
    return estados;
  }

  /**
   * Devuelve **todos** los estados asociados a la sesión (incluye finalizados),
   * ordenados por fecha de inicio ascendente.
   */
  async findAllBySesion(sesionTrabajoId: string) {
    return this.repo.find({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
      order: { inicio: 'ASC' },
      relations: ['sesionTrabajo'],
    });
  }

  /**
   * Devuelve el último estado registrado para la sesión,
   * independientemente de si ya finalizó.
   */
  async findLatestBySesion(sesionTrabajoId: string) {
    return this.repo.findOne({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
      order: { inicio: 'DESC' },
      relations: ['sesionTrabajo'],
    });
  }

  /**
   * Devuelve el estado **actual** de la sesión (fin IS NULL).  
   * Si no hay un estado abierto, retorna null.
   */
  async findCurrentBySesion(sesionTrabajoId: string) {
    return this.repo.findOne({
      where: {
        sesionTrabajo: { id: sesionTrabajoId, fechaFin: IsNull() },
        fin: IsNull(),
      },
      order: { inicio: 'DESC' },
      relations: ['sesionTrabajo'],
    });
  }

  async removeBySesion(sesionTrabajoId: string) {
    const estados = await this.repo.find({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
    });
    await this.repo.remove(estados);
    return { deleted: true, count: estados.length };
  }
}

