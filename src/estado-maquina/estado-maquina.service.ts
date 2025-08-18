import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DateTime } from 'luxon';
import { EstadoMaquina } from './estado-maquina.entity';
import { CreateEstadoMaquinaDto } from './dto/create-estado-maquina.dto';
import { UpdateEstadoMaquinaDto } from './dto/update-estado-maquina.dto';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';
import { TipoEstadoSesion } from '../estado-sesion/estado-sesion.entity';
import { PasoProduccionService } from '../paso-produccion/paso-produccion.service';
import { PausaPasoSesionService } from '../pausa-paso-sesion/pausa-paso-sesion.service';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';

@Injectable()
export class EstadoMaquinaService {
  constructor(
    @InjectRepository(EstadoMaquina)
    private readonly repo: Repository<EstadoMaquina>,
    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    @InjectRepository(EstadoTrabajador)
    private readonly estadoTrabajadorRepo: Repository<EstadoTrabajador>,
    private readonly estadoSesionService: EstadoSesionService,
    private readonly pasoProduccionService: PasoProduccionService,
    private readonly pausaPasoSesionService: PausaPasoSesionService,
  ) {}

  async create(dto: CreateEstadoMaquinaDto) {
    const inicio = DateTime.now().setZone('America/Bogota').toJSDate();
    const fin = null;

    const abiertos = await this.repo.find({
      where: { maquina: { id: dto.maquina }, fin: IsNull() },
    });
    for (const a of abiertos) {
      a.fin = inicio;
      await this.repo.save(a);
    }

    const entity = this.repo.create({
      maquina: { id: dto.maquina } as any,
      mantenimiento: dto.mantenimiento,
      inicio,
      fin: null,
    });
    const nuevo = await this.repo.save(entity);

    if (dto.mantenimiento) {
      await this.pausarPasoSesion(dto.maquina, inicio);
    }

    await this.actualizarSesionOtro(dto.maquina, inicio);

    return nuevo;
  }

  findAll() {
    return this.repo.find({ relations: ['maquina'] });
  }

  async findOne(id: string) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['maquina'],
    });
    if (!estado) throw new NotFoundException('Estado de máquina no encontrado');
    return estado;
  }

  async update(id: string, dto: UpdateEstadoMaquinaDto) {
    const estado = await this.repo.findOne({
      where: { id },
      relations: ['maquina'],
    });
    if (!estado) throw new NotFoundException('Estado de máquina no encontrado');
    if (dto.fin)
      estado.fin = DateTime.fromJSDate(dto.fin, {
        zone: 'America/Bogota',
      }).toJSDate();
    const actualizado = await this.repo.save(estado);

    if (dto.fin) {
      await this.restaurarPausasPasoSesion(estado.maquina.id, estado.fin);
      await this.restaurarSesionProduccion(estado.maquina.id, estado.fin);
    }

    return actualizado;
  }

  async remove(id: string) {
    const estado = await this.repo.findOne({ where: { id } });
    if (!estado) throw new NotFoundException('Estado de máquina no encontrado');
    await this.repo.remove(estado);
    return { deleted: true };
  }

  findByMaquina(maquinaId: string, inicioStr: string, finStr: string) {
    const inicio = DateTime.fromISO(inicioStr, {
      zone: 'America/Bogota',
    }).toJSDate();
    const fin = DateTime.fromISO(finStr, {
      zone: 'America/Bogota',
    }).toJSDate();
    return this.repo
      .createQueryBuilder('estado')
      .leftJoinAndSelect('estado.maquina', 'maquina')
      .where('maquina.id = :maquinaId', { maquinaId })
      .andWhere('estado.inicio <= :fin')
      .andWhere('(estado.fin IS NULL OR estado.fin >= :inicio)')
      .orderBy('estado.inicio', 'DESC')
      .setParameters({ inicio, fin })
      .getMany();
  }

  private async pausarPasoSesion(maquinaId: string, fecha: Date) {
    const sesion = await this.sesionRepo.findOne({
      where: { maquina: { id: maquinaId }, fechaFin: IsNull() },
    });
    if (!sesion) return;

    const stpRepo = this.repo.manager.getRepository(SesionTrabajoPaso);
    const pasos = await stpRepo.find({
      where: { sesionTrabajo: { id: sesion.id } },
    });

    for (const paso of pasos) {
      const pausaActiva = await this.pausaPasoSesionService.findActive(paso.id);
      if (!pausaActiva) {

        await this.pausaPasoSesionService.create(paso.id, fecha, maquinaId);

        break;
      }
    }
  }

  private async actualizarSesionOtro(maquinaId: string, fecha: Date) {
    const sesion = await this.sesionRepo.findOne({
      where: { maquina: { id: maquinaId }, fechaFin: IsNull() },
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
    await this.pasoProduccionService.actualizarEstadoPorSesion(sesion.id);
  }

  private async restaurarSesionProduccion(
    maquinaId: string,
    fin: Date | null,
  ) {
    const sesion = await this.sesionRepo.findOne({
      where: { maquina: { id: maquinaId }, fechaFin: IsNull() },
      relations: ['trabajador'],
    });
    if (!sesion || !fin) return;
    const maquinaActiva = await this.repo.findOne({
      where: { maquina: { id: maquinaId }, fin: IsNull() },
    });
    const trabajadorActivo = await this.estadoTrabajadorRepo.findOne({
      where: { trabajador: { id: sesion.trabajador.id }, fin: IsNull() },
    });
    if (maquinaActiva || trabajadorActivo) return;
    const estados = await this.estadoSesionService.findBySesion(sesion.id);
    const actual = estados.find((e) => e.fin === null);
    if (!actual || actual.estado !== TipoEstadoSesion.OTRO) return;
    await this.estadoSesionService.update(actual.id, { fin });
    await this.estadoSesionService.create({
      sesionTrabajo: sesion.id,
      estado: TipoEstadoSesion.PRODUCCION,
      inicio: fin,
    });
    await this.pasoProduccionService.actualizarEstadoPorSesion(sesion.id);
  }

  private async restaurarPausasPasoSesion(
    maquinaId: string,
    fin: Date | null,
  ) {
    const sesion = await this.sesionRepo.findOne({
      where: { maquina: { id: maquinaId }, fechaFin: IsNull() },
    });
    if (!sesion || !fin) return;
    const stpRepo = this.repo.manager.getRepository(SesionTrabajoPaso);
    const pasos = await stpRepo.find({
      where: { sesionTrabajo: { id: sesion.id } },
    });
    for (const paso of pasos) {
      await this.pausaPasoSesionService.closeActive(paso.id, fin, maquinaId);
    }
  }
}
