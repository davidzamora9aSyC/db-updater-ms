import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PasoProduccion } from './paso-produccion.entity'
import { CreatePasoProduccionDto } from './dto/create-paso-produccion.dto'
import { UpdatePasoProduccionDto } from './dto/update-paso-produccion.dto'

@Injectable()
export class PasoProduccionService {
  constructor(
    @InjectRepository(PasoProduccion) private readonly repo: Repository<PasoProduccion>
  ) {}

  create(dto: CreatePasoProduccionDto) {
    const paso = this.repo.create({
      ...dto,
      orden: { id: dto.orden } as any,
    });
    return this.repo.save(paso);
  }

  findAll() {
    return this.repo.find({ relations: ['orden'] });
  }

  async findOne(id: string) {
    const paso = await this.repo.findOne({ where: { id } });
    if (!paso) throw new NotFoundException('Paso no encontrado');
    return paso;
  }

  async update(id: string, dto: UpdatePasoProduccionDto) {
    const paso = await this.repo.findOne({ where: { id } });
    if (!paso) throw new NotFoundException('Paso no encontrado');
    if (dto.orden) paso.orden = { id: dto.orden } as any;
    Object.assign(paso, dto);
    return this.repo.save(paso);
  }

  async remove(id: string) {
    const paso = await this.repo.findOne({ where: { id } });
    if (!paso) throw new NotFoundException('Paso no encontrado');
    await this.repo.remove(paso);
    return { deleted: true };
  }

  async findByOrden(ordenId: string) {
    return this.repo.find({
      where: { orden: { id: ordenId } },
      relations: ['orden'],
      order: { createdAt: 'ASC' }
    });
  }
}