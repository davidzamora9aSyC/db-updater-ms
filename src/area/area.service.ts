import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './area.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreaService {
  constructor(
    @InjectRepository(Area) private readonly repo: Repository<Area>,
  ) {}

  create(dto: CreateAreaDto) {
    const area = this.repo.create(dto);
    return this.repo.save(area);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const area = await this.repo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('Área no encontrada');
    return area;
  }

  async update(id: string, dto: UpdateAreaDto) {
    const area = await this.repo.preload({ id, ...dto });
    if (!area) throw new NotFoundException('Área no encontrada');
    return this.repo.save(area);
  }

  async remove(id: string) {
    const area = await this.repo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('Área no encontrada');
    await this.repo.remove(area);
    return { deleted: true };
  }
}
