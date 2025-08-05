import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { EstadoSesion } from './estado-sesion.entity';
import { CreateEstadoSesionDto } from './dto/create-estado-sesion.dto';
import { UpdateEstadoSesionDto } from './dto/update-estado-sesion.dto';
import { PasoProduccionService } from '../paso-produccion/paso-produccion.service';

@Injectable()
export class EstadoSesionService {
  constructor(
    @InjectRepository(EstadoSesion)
    private readonly repo: Repository<EstadoSesion>,
    private readonly pasoService: PasoProduccionService,
  ) {}

  async create(dto: CreateEstadoSesionDto) {
    const nuevo = this.repo.create({
      ...dto,
      inicio: DateTime.fromJSDate(dto.inicio, { zone: 'America/Bogota' }).toJSDate(),
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
    const estados = await this.repo.find({ relations: ['sesionTrabajo'] });
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
      estado.inicio = DateTime.fromJSDate(dto.inicio, { zone: 'America/Bogota' }).toJSDate();
    if (dto.fin)
      estado.fin = DateTime.fromJSDate(dto.fin, { zone: 'America/Bogota' }).toJSDate();
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
      where: { sesionTrabajo: { id: sesionTrabajoId } },
      relations: ['sesionTrabajo'],
      order: { inicio: 'DESC' },
    });
    return estados;
  }

  async removeBySesion(sesionTrabajoId: string) {
    const estados = await this.repo.find({
      where: { sesionTrabajo: { id: sesionTrabajoId } },
    });
    await this.repo.remove(estados);
    return { deleted: true, count: estados.length };
  }
}

