import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DateTime } from 'luxon';
import { EstadoTrabajador } from './estado-trabajador.entity';
import { CreateEstadoTrabajadorDto } from './dto/create-estado-trabajador.dto';
import { UpdateEstadoTrabajadorDto } from './dto/update-estado-trabajador.dto';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';
import { TipoEstadoSesion } from '../estado-sesion/estado-sesion.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';

@Injectable()
export class EstadoTrabajadorService {
  constructor(
    @InjectRepository(EstadoTrabajador)
    private readonly repo: Repository<EstadoTrabajador>,
    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    @InjectRepository(EstadoMaquina)
    private readonly estadoMaquinaRepo: Repository<EstadoMaquina>,
    private readonly estadoSesionService: EstadoSesionService,
  ) {}

  async create(dto: CreateEstadoTrabajadorDto) {
    const inicio = DateTime.fromJSDate(dto.inicio, {
      zone: 'America/Bogota',
    }).toJSDate();
    const fin = dto.fin
      ? DateTime.fromJSDate(dto.fin, { zone: 'America/Bogota' }).toJSDate()
      : null;

    const abiertos = await this.repo.find({
      where: { trabajador: { id: dto.trabajador }, fin: IsNull() },
    });
    for (const a of abiertos) {
      a.fin = inicio;
      await this.repo.save(a);
    }

    const entity = this.repo.create({
      trabajador: { id: dto.trabajador } as any,
      descanso: dto.descanso,
      inicio,
      fin,
    });
    const nuevo = await this.repo.save(entity);

    await this.actualizarSesionOtro(dto.trabajador, inicio);

    return nuevo;
  }

  findAll() {
    return this.repo.find({ relations: ['trabajador'] });
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    return estado;
  }

  async update(id: string, dto: UpdateEstadoTrabajadorDto) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    if (dto.trabajador)
      estado.trabajador = { id: dto.trabajador } as any;
    if (dto.descanso !== undefined) estado.descanso = dto.descanso;
    if (dto.inicio)
      estado.inicio = DateTime.fromJSDate(dto.inicio, {
        zone: 'America/Bogota',
      }).toJSDate();
    if (dto.fin)
      estado.fin = DateTime.fromJSDate(dto.fin, {
        zone: 'America/Bogota',
      }).toJSDate();
    const actualizado = await this.repo.save(estado);

    if (dto.fin) {
      await this.restaurarSesionProduccion(
        estado.trabajador.id,
        estado.fin,
      );
    }

    return actualizado;
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de trabajador no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }

  findByTrabajador(trabajadorId: string) {
    return this.repo.find({
      where: { trabajador: { id: trabajadorId } },
      relations: ['trabajador'],
      order: { inicio: 'DESC' },
    });
  }

  private async actualizarSesionOtro(trabajadorId: string, fecha: Date) {
    const sesion = await this.sesionRepo.findOne({
      where: { trabajador: { id: trabajadorId }, fechaFin: IsNull() },
    });
    if (!sesion) return;
    const estados = await this.estadoSesionService.findBySesion(sesion.id);
    const actual = estados.find((e) => e.fin === null);
    if (actual?.estado === TipoEstadoSesion.OTRO) return;
    if (actual)
      await this.estadoSesionService.update(actual.id, { fin: fecha });
    await this.estadoSesionService.create({
      sesionTrabajo: sesion.id,
      estado: TipoEstadoSesion.OTRO,
      inicio: fecha,
    });
  }

  private async restaurarSesionProduccion(
    trabajadorId: string,
    fin: Date | null,
  ) {
    const sesion = await this.sesionRepo.findOne({
      where: { trabajador: { id: trabajadorId }, fechaFin: IsNull() },
      relations: ['maquina'],
    });
    if (!sesion || !fin) return;
    const trabajadorActivo = await this.repo.findOne({
      where: { trabajador: { id: trabajadorId }, fin: IsNull() },
    });
    const maquinaActiva = await this.estadoMaquinaRepo.findOne({
      where: { maquina: { id: sesion.maquina.id }, fin: IsNull() },
    });
    if (trabajadorActivo || maquinaActiva) return;
    const estados = await this.estadoSesionService.findBySesion(sesion.id);
    const actual = estados.find((e) => e.fin === null);
    if (!actual || actual.estado !== TipoEstadoSesion.OTRO) return;
    await this.estadoSesionService.update(actual.id, { fin });
    await this.estadoSesionService.create({
      sesionTrabajo: sesion.id,
      estado: TipoEstadoSesion.PRODUCCION,
      inicio: fin,
    });
  }
}
