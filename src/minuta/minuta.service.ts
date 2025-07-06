import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Minuta } from './minuta.entity'
import { CreateMinutaDto } from './dto/create-minuta.dto'

@Injectable()
export class MinutaService {
  constructor(@InjectRepository(Minuta) private readonly repo: Repository<Minuta>) {}

  async create(dto: CreateMinutaDto) {
    const nueva = this.repo.create(dto);
    return this.repo.save(nueva);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}