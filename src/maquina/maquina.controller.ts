import { Controller, Post, Get, Put,Patch, Param, Body, Delete } from '@nestjs/common';
import { MaquinaService } from './maquina.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';

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

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaquinaDto) {
    return this.maquinaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maquinaService.remove(id);
  }

  
}