import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import { MaquinaService } from './maquina.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';

@Controller('maquinas')
export class MaquinaController {
  constructor(private readonly maquinaService: MaquinaService) {}

  @Post()
  create(@Body() dto: CreateMaquinaDto) {
    
    return this.maquinaService.create(dto);
  }

  @Get()
  findAll() {
    return this.maquinaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maquinaService.findOne(id);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.maquinaService.updateEstado(id, dto);
  }
}