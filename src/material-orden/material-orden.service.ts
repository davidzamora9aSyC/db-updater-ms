import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialOrden } from './material-orden.entity';
import { CreateMaterialOrdenDto } from './dto/create-material-orden.dto';
import { UpdateMaterialOrdenDto } from './dto/update-material-orden.dto';

@Injectable()
export class MaterialOrdenService {
  constructor(
    @InjectRepository(MaterialOrden) private readonly repo: Repository<MaterialOrden>,
  ) {}

  create(dto: CreateMaterialOrdenDto) {
    const material = this.repo.create({
      ...dto,
      orden: { id: dto.orden } as any,
    });
    return this.repo.save(material);
  }

  findAll() {
    return this.repo.find({ relations: ['orden'] });
  }

  async findOne(id: string) {
    const material = await this.repo.findOne({ where: { id }, relations: ['orden'] });
    if (!material) throw new NotFoundException('Material no encontrado');
    return material;
  }

  async update(id: string, dto: UpdateMaterialOrdenDto) {
    const material = await this.repo.findOne({ where: { id } });
    if (!material) throw new NotFoundException('Material no encontrado');
    if (dto.orden) material.orden = { id: dto.orden } as any;
    Object.assign(material, dto);
    return this.repo.save(material);
  }

  async remove(id: string) {
    const material = await this.repo.findOne({ where: { id } });
    if (!material) throw new NotFoundException('Material no encontrado');
    await this.repo.remove(material);
    return { deleted: true };
  }
}
