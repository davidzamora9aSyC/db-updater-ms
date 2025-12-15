import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, Not } from 'typeorm';
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

      if (existente && !existente.finalizado) {
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
      finalizado: false,
      finalizadoEn: null,
    });

    // Guardar la relación
    const saved = await this.repo.save(entity);
    await this.redistribuirPorPaso(paso.id);

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

    if (entity.finalizado || entity.sesionTrabajo.fechaFin) {
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
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['pasoOrden', 'sesionTrabajo'],
    });
    if (!entity) throw new NotFoundException('Relación no encontrada');
    if (dto.cantidadAsignada !== undefined) {
      if (dto.cantidadAsignada >= entity.cantidadPedaleos) {
        entity.cantidadAsignada = dto.cantidadAsignada;
      }
    }
    const incrementoProducido =
      dto.cantidadProducida !== undefined
        ? Math.max(dto.cantidadProducida, 0)
        : 0;
    if (incrementoProducido > 0) {
      entity.cantidadProducida += incrementoProducido;
    }
    const incrementoPedaleos =
      dto.cantidadPedaleos !== undefined
        ? Math.max(dto.cantidadPedaleos, 0)
        : 0;
    if (incrementoPedaleos > 0) {
      entity.cantidadPedaleos += incrementoPedaleos;
    }
    const saved = await this.repo.save(entity);
    if (incrementoProducido > 0 || incrementoPedaleos > 0) {
      const pasoRepo = this.repo.manager.getRepository(PasoProduccion);
      const sesionRepo = this.repo.manager.getRepository(SesionTrabajo);
      if (incrementoProducido > 0) {
        await pasoRepo.increment(
          { id: entity.pasoOrden.id },
          'cantidadProducida',
          incrementoProducido,
        );
        await sesionRepo.increment(
          { id: entity.sesionTrabajo.id },
          'cantidadProducida',
          incrementoProducido,
        );
      }
      if (incrementoPedaleos > 0) {
        await pasoRepo.increment(
          { id: entity.pasoOrden.id },
          'cantidadPedaleos',
          incrementoPedaleos,
        );
        await sesionRepo.increment(
          { id: entity.sesionTrabajo.id },
          'cantidadPedaleos',
          incrementoPedaleos,
        );
      }
    }
    await this.redistribuirPorPaso(entity.pasoOrden.id);
    return saved;
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
    return this.repo
      .find({
        where: { sesionTrabajo: { id: sesionId } },
        relations: [
          'sesionTrabajo',
          'sesionTrabajo.trabajador',
          'sesionTrabajo.maquina',
          'pasoOrden',
        ],
      })
      .then((entities) => Promise.all(entities.map((e) => this.mapEstado(e))));
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

  async finalizar(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['pasoOrden', 'sesionTrabajo'],
    });
    if (!entity) throw new NotFoundException('Relación no encontrada');
    if (entity.finalizado) {
      throw new BadRequestException('La asignación ya estaba finalizada');
    }

    entity.finalizado = true;
    entity.finalizadoEn = new Date();
    await this.repo.save(entity);
    await this.pausaPasoSesionService.closeActive(entity.id);
    await this.redistribuirPorPaso(entity.pasoOrden.id);
    await this.pasoProduccionService.actualizarEstadoPorSesion(
      entity.sesionTrabajo.id,
    );
    return this.mapEstado(entity);
  }

  async finalizarDeSesionesTerminadas() {
    const relaciones = await this.repo.find({
      where: {
        finalizado: false,
        sesionTrabajo: { fechaFin: Not(IsNull()) },
      },
      relations: ['pasoOrden', 'sesionTrabajo'],
    });
    if (relaciones.length === 0) {
      return { total: 0, finalizados: [] as string[] };
    }
    const ahora = new Date();
    const finalizados: string[] = [];
    for (const rel of relaciones) {
      rel.finalizado = true;
      rel.finalizadoEn = ahora;
      await this.repo.save(rel);
      await this.pausaPasoSesionService.closeActive(rel.id);
      await this.redistribuirPorPaso(rel.pasoOrden.id);
      await this.pasoProduccionService.actualizarEstadoPorSesion(
        rel.sesionTrabajo.id,
      );
      finalizados.push(rel.id);
    }
    return { total: finalizados.length, finalizados };
  }

  async redistribuirPorPaso(pasoId: string) {
    await this.recalcularAsignaciones(pasoId);
  }

  private async recalcularAsignaciones(pasoId: string) {
    const pasoRepo = this.repo.manager.getRepository(PasoProduccion);
    let paso = await pasoRepo.findOne({ where: { id: pasoId } });
    if (!paso) return;
    paso = await this.sincronizarTotalesPaso(paso);

    const activos = await this.repo.find({
      where: { pasoOrden: { id: pasoId }, finalizado: false },
      order: { id: 'ASC' },
    });
    if (activos.length === 0) return;

    const faltantes = this.calcularFaltantePaso(paso);
    const cuotaBase = activos.length > 0 ? Math.floor(faltantes / activos.length) : 0;
    let residuo = faltantes - cuotaBase * activos.length;

    for (const relacion of activos) {
      const extra = residuo > 0 ? 1 : 0;
      if (residuo > 0) residuo--;
      const cuota = cuotaBase + extra;
      const minimo = Math.max(relacion.cantidadPedaleos ?? 0, relacion.cantidadProducida ?? 0);
      relacion.cantidadAsignada = Math.max(minimo, cuota);
    }

    await this.repo.save(activos);
  }

  private calcularFaltantePaso(paso: PasoProduccion) {
    const piezasPrevias = paso.cantidadProducida ?? 0;
    const pedaleosPrevios = paso.cantidadPedaleos ?? 0;
    const noConformesPrevios = Math.max(pedaleosPrevios - piezasPrevias, 0);
    return Math.max(paso.cantidadRequerida - piezasPrevias - noConformesPrevios, 0);
  }

  private async sincronizarTotalesPaso(paso: PasoProduccion) {
    const totals = await this.repo
      .createQueryBuilder('stp')
      .select('COALESCE(SUM(stp.cantidadProducida),0)', 'produccion')
      .addSelect('COALESCE(SUM(stp.cantidadPedaleos),0)', 'pedaleos')
      .where('"pasoOrdenId" = :pasoId', { pasoId: paso.id })
      .getRawOne<{ produccion: string; pedaleos: string }>();
    const produccion = Number(totals?.produccion ?? 0);
    const pedaleos = Number(totals?.pedaleos ?? 0);
    paso.cantidadProducida = produccion;
    paso.cantidadPedaleos = pedaleos;
    await this.repo.manager.getRepository(PasoProduccion).save(paso);
    return paso;
  }
}
