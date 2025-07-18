import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './empresa.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(@InjectRepository(Empresa) private readonly repo: Repository<Empresa>) {}

  create(dto: CreateEmpresaDto) {
    const empresa = this.repo.create(dto);
    return this.repo.save(empresa);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const empresa = await this.repo.findOne({ where: { id } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto) {
    const empresa = await this.repo.preload({ id, ...dto });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return this.repo.save(empresa);
  }

  async remove(id: string) {
    const empresa = await this.repo.findOne({ where: { id } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    await this.repo.remove(empresa);
    return { deleted: true };
  }
}
