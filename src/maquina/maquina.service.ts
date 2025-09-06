import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Maquina } from './maquina.entity';
import { Area } from '../area/area.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { EstadoSesion } from '../estado-sesion/estado-sesion.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';

@Injectable()
export class MaquinaService {
  constructor(
    @InjectRepository(Maquina) private readonly repo: Repository<Maquina>,
    @InjectRepository(SesionTrabajo)
    private readonly sesionRepo: Repository<SesionTrabajo>,
    @InjectRepository(EstadoSesion)
    private readonly estadoSesionRepo: Repository<EstadoSesion>,
    @InjectRepository(EstadoMaquina)
    private readonly estadoMaqRepo: Repository<EstadoMaquina>,
  ) {}

  async create(dto: CreateMaquinaDto) {
    const existente = await this.repo.findOne({ where: { codigo: dto.codigo } });
    if (existente)
      throw new BadRequestException('No se puede repetir el codigo de equipo');
    const { areaId, ...rest } = dto as any;
    const nueva = this.repo.create({ ...rest, area: { id: areaId } as Area });
    return this.repo.save(nueva);
  }

  async findAll() {
    const maquinas = await this.repo.find({ relations: ['area'] });
    return Promise.all(
      maquinas.map(async (m) => ({
        ...m,
        estado: await this.getEstado(m.id),
        areaNombre: m.area?.nombre,
      })),
    );
  }

  async findOne(id: string) {
    const maquina = await this.repo.findOne({ where: { id }, relations: ['area'] });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    const estado = await this.getEstado(id);
    return { ...maquina, estado, areaNombre: maquina.area?.nombre };
  }

  async update(id: string, dto: UpdateMaquinaDto) {
    const maquina = await this.repo.findOne({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    const { areaId, ...rest } = dto as any;
    Object.assign(maquina, rest);
    if (areaId) maquina.area = { id: areaId } as Area;
    return this.repo.save(maquina);
  }

  async remove(id: string) {
    const maquina = await this.repo.findOne({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    return this.repo.remove(maquina);
  }

  private async getEstado(maquinaId: string): Promise<string> {
    const sesion = await this.sesionRepo.findOne({
      where: { maquina: { id: maquinaId }, fechaFin: IsNull() },
      order: { fechaInicio: 'DESC' },
    });
    if (sesion) {
      const estadoSesion = await this.estadoSesionRepo.findOne({
        where: { sesionTrabajo: { id: sesion.id } },
        order: { inicio: 'DESC' },
      });
      return estadoSesion?.estado ?? 'inactivo';
    }
    const estadoMaq = await this.estadoMaqRepo.findOne({
      where: {
        maquina: { id: maquinaId },
        fin: IsNull(),
        mantenimiento: true,
      },
    });
    if (estadoMaq) return 'mantenimiento';
    return 'inactivo';
  }

  async buscar(opts: { q?: string; nombre?: string; areaId?: string; limit?: number }) {
    const qb = this.repo.createQueryBuilder('m').leftJoinAndSelect('m.area', 'a')
    const limit = Math.min(Math.max(opts.limit || 20, 1), 100)
    const whereParts: string[] = []
    const params: Record<string, any> = {}

    if (opts.q && opts.q.trim()) {
      whereParts.push('(LOWER(m.nombre) LIKE :q OR LOWER(m.codigo) LIKE :q)')
      params.q = `%${opts.q.trim().toLowerCase()}%`
    }
    if (opts.nombre && opts.nombre.trim()) {
      whereParts.push('LOWER(m.nombre) LIKE :nombre')
      params.nombre = `%${opts.nombre.trim().toLowerCase()}%`
    }
    if (opts.areaId && opts.areaId.trim()) {
      whereParts.push('a.id = :areaId')
      params.areaId = opts.areaId.trim()
    }

    if (whereParts.length > 0) qb.where(whereParts.join(' AND '), params)
    const rows = await qb.orderBy('m.nombre', 'ASC').take(limit).getMany()

    return Promise.all(
      rows.map(async (m) => ({
        ...m,
        estado: await this.getEstado(m.id),
        areaNombre: m.area?.nombre,
      })),
    )
  }
}
