import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SesionTrabajoPaso } from './sesion-trabajo-paso.entity';
import { SesionTrabajo, FuenteDatosSesion } from '../sesion-trabajo/sesion-trabajo.entity';
import { PasoProduccion } from '../paso-produccion/paso-produccion.entity';
import { CreateSesionTrabajoPasoDto } from './dto/create-sesion-trabajo-paso.dto';
import { UpdateSesionTrabajoPasoDto } from './dto/update-sesion-trabajo-paso.dto';
import {
  EstadoSesion,
  TipoEstadoSesion,
} from '../estado-sesion/estado-sesion.entity';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';
import { SesionTrabajoPasoDto } from './dto/sesion-trabajo-paso.dto';
import { PasoProduccionService } from '../paso-produccion/paso-produccion.service';
import { PausaPasoSesionService } from '../pausa-paso-sesion/pausa-paso-sesion.service';

@Injectable()
export class SesionTrabajoPasoService {
  constructor(
    @InjectRepository(SesionTrabajoPaso)
    private readonly repo: Repository<SesionTrabajoPaso>,
    private readonly pasoProduccionService: PasoProduccionService,
    private readonly pausaPasoSesionService: PausaPasoSesionService,
  ) {}

  async create(dto: CreateSesionTrabajoPasoDto) {
    dto.porAdministrador ??= false;
    const desdeTablet = dto.desdeTablet === true;
    if (!dto.porAdministrador) {
      // Verificar si ya existe la relación
      const existente = await this.repo.findOne({
        where: {
          sesionTrabajo: { id: dto.sesionTrabajo },
          pasoOrden: { id: dto.pasoOrden },
        },
        relations: ['sesionTrabajo'],
      });

      if (existente) {
        const ahora = new Date();
        await this.pausaPasoSesionService.closeActive(existente.id);
        if (
          (desdeTablet || existente.sesionTrabajo?.fuente === FuenteDatosSesion.TABLET) &&
          existente.fuente !== FuenteDatosSesion.TABLET
        ) {
          existente.fuente = FuenteDatosSesion.TABLET;
          await this.repo.save(existente);
        }
        const otros = await this.repo.find({
          where: { sesionTrabajo: { id: dto.sesionTrabajo } },
        });
        for (const otro of otros) {
          if (otro.id === existente.id) continue;
          const activo = await this.pausaPasoSesionService.findActive(otro.id);
          if (!activo) {
            await this.pausaPasoSesionService.create(otro.id, ahora);
          }
        }
        const estadoSesionRepo = this.repo.manager.getRepository(EstadoSesion);
        const estadoActivo = await estadoSesionRepo.findOne({
          where: { sesionTrabajo: { id: dto.sesionTrabajo }, fin: IsNull() },
        });
        if (estadoActivo) {
          await estadoSesionRepo.update(estadoActivo.id, { fin: ahora });
        }
        const estadoSesion = estadoSesionRepo.create({
          sesionTrabajo: { id: dto.sesionTrabajo } as SesionTrabajo,
          estado: TipoEstadoSesion.PRODUCCION,
          inicio: ahora,
        });
        await estadoSesionRepo.save(estadoSesion);
        await this.pasoProduccionService.actualizarEstadoPorSesion(
          dto.sesionTrabajo,
        );
        return existente;
      }
    }

    // Verificar que la sesión exista y no tenga fechaFin
    const sesionRepo = this.repo.manager.getRepository(SesionTrabajo);
    const sesion = await sesionRepo.findOne({
      where: { id: dto.sesionTrabajo },
    });
    if (!sesion || sesion.fechaFin) {
      throw new NotFoundException('Sesión no encontrada o finalizada');
    }
    if (desdeTablet && sesion.fuente !== FuenteDatosSesion.TABLET) {
      sesion.fuente = FuenteDatosSesion.TABLET;
      await sesionRepo.save(sesion);
    }

    // Verificar que el paso de producción exista
    const pasoRepo = this.repo.manager.getRepository(PasoProduccion);
    const paso = await pasoRepo.findOne({
      where: { id: dto.pasoOrden },
    });
    if (!paso) {
      throw new NotFoundException('Paso de producción no encontrado');
    }

    // Ajusta contra producción previa y no conformes acumulados para evitar sobreasignaciones.
    const piezasPrevias = paso.cantidadProducida ?? 0;
    const pedaleosPrevios = paso.cantidadPedaleos ?? 0;
    const noConformesPrevios = Math.max(pedaleosPrevios - piezasPrevias, 0);
    const cantidadAsignada =
      dto.cantidadAsignada ??
      Math.max(paso.cantidadRequerida - piezasPrevias - noConformesPrevios, 0);

    // Crear la relación SesionTrabajoPaso
    const fuenteAsignacion =
      desdeTablet || sesion.fuente === FuenteDatosSesion.TABLET
        ? FuenteDatosSesion.TABLET
        : null;
    const entity = this.repo.create({
      sesionTrabajo: { id: dto.sesionTrabajo } as SesionTrabajo,
      pasoOrden: { id: dto.pasoOrden } as PasoProduccion,
      cantidadAsignada,
      cantidadProducida: 0,
      cantidadPedaleos: 0,
      fuente: fuenteAsignacion,
    });

    // Guardar la relación
    const saved = await this.repo.save(entity);

    if (dto.porAdministrador) {
      await this.pausaPasoSesionService.create(saved.id);
    } else {
      // Cambiar el estado de la sesión a PRODUCCION y guardar
      const estadoSesionRepo = this.repo.manager.getRepository(EstadoSesion);
      const estadoActivo = await estadoSesionRepo.findOne({
        where: { sesionTrabajo: { id: dto.sesionTrabajo }, fin: IsNull() },
      });
      const ahora = new Date();
      if (estadoActivo) {
        await estadoSesionRepo.update(estadoActivo.id, { fin: ahora });
      }
      const estadoSesion = estadoSesionRepo.create({
        sesionTrabajo: sesion,
        estado: TipoEstadoSesion.PRODUCCION,
        inicio: ahora,
      });
      await estadoSesionRepo.save(estadoSesion);

      const otros = await this.repo.find({
        where: { sesionTrabajo: { id: dto.sesionTrabajo } },
      });
      for (const otro of otros) {
        if (otro.id === saved.id) continue;
        const activo = await this.pausaPasoSesionService.findActive(otro.id);
        if (!activo) {
          await this.pausaPasoSesionService.create(otro.id, ahora);
        }
      }
      await this.pausaPasoSesionService.closeActive(saved.id);
    }

    await this.pasoProduccionService.actualizarEstadoPorSesion(
      dto.sesionTrabajo,
    );
    return saved;
  }

  async findAll(): Promise<SesionTrabajoPasoDto[]> {
    const entities = await this.repo.find({
      relations: [
        'sesionTrabajo',
        'sesionTrabajo.trabajador',
        'sesionTrabajo.maquina',
        'pasoOrden',
      ],
    });
    return Promise.all(entities.map((e) => this.mapEstado(e)));
  }

  async findOne(id: string): Promise<SesionTrabajoPasoDto> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: [
        'sesionTrabajo',
        'sesionTrabajo.trabajador',
        'sesionTrabajo.maquina',
        'pasoOrden',
      ],
    });
    if (!entity) throw new NotFoundException('Relación no encontrada');
    return this.mapEstado(entity);
  }

  // deuvleve un dto que es igual a la entidad de la relacion mas el estado calculado desde la sesion.
  private async mapEstado(
    entity: SesionTrabajoPaso,
  ): Promise<SesionTrabajoPasoDto> {
    const estadoSesionRepo = this.repo.manager.getRepository(EstadoSesion);
    const estadoSesion = await estadoSesionRepo.findOne({
      where: { sesionTrabajo: { id: entity.sesionTrabajo.id }, fin: IsNull() },
      order: { inicio: 'DESC' },
    });

    if (entity.sesionTrabajo.fechaFin) {
      return { ...entity, estado: 'finalizada' };
    }

    let estado: string = estadoSesion?.estado || TipoEstadoSesion.OTRO;

    if (estadoSesion?.estado === TipoEstadoSesion.OTRO) {
      const estadoTrabRepo = this.repo.manager.getRepository(EstadoTrabajador);
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
        const estadoMaqRepo = this.repo.manager.getRepository(EstadoMaquina);
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

    return { ...entity, estado };
  }

  async update(id: string, dto: UpdateSesionTrabajoPasoDto) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Relación no encontrada');
    if (dto.cantidadAsignada !== undefined) {
      if (dto.cantidadAsignada >= entity.cantidadPedaleos) {
        entity.cantidadAsignada = dto.cantidadAsignada;
      }
    }
    if (dto.cantidadProducida !== undefined) {
      if (dto.cantidadProducida > entity.cantidadProducida) {
        entity.cantidadProducida = dto.cantidadProducida;
      }
    }
    if (dto.cantidadPedaleos !== undefined) {
      if (dto.cantidadPedaleos > entity.cantidadPedaleos) {
        entity.cantidadPedaleos = dto.cantidadPedaleos;
      }
    }
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Relación no encontrada');
    await this.repo.remove(entity);
    return { deleted: true };
  }
  async findByPaso(pasoId: string): Promise<SesionTrabajoPasoDto[]> {
    const entities = await this.repo.find({
      where: { pasoOrden: { id: pasoId } },
      relations: [
        'sesionTrabajo',
        'sesionTrabajo.trabajador',
        'sesionTrabajo.maquina',
        'pasoOrden',
      ],
    });
    return Promise.all(entities.map((e) => this.mapEstado(e)));
  }

  findBySesion(sesionId: string) {
    return this.repo.find({
      where: { sesionTrabajo: { id: sesionId } },
      relations: [
        'sesionTrabajo',
        'sesionTrabajo.trabajador',
        'sesionTrabajo.maquina',
        'pasoOrden',
      ],
    });
  }

  async removeByPaso(pasoId: string) {
    const relaciones = await this.repo.find({
      where: { pasoOrden: { id: pasoId } },
    });
    await this.repo.remove(relaciones);
    return { deleted: true, count: relaciones.length };
  }

  async removeBySesion(sesionId: string) {
    const relaciones = await this.repo.find({
      where: { sesionTrabajo: { id: sesionId } },
    });
    await this.repo.remove(relaciones);
    return { deleted: true, count: relaciones.length };
  }
}
