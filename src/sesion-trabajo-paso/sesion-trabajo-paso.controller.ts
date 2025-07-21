import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common';
import { SesionTrabajoPasoService } from './sesion-trabajo-paso.service';
import { CreateSesionTrabajoPasoDto } from './dto/create-sesion-trabajo-paso.dto';
import { UpdateSesionTrabajoPasoDto } from './dto/update-sesion-trabajo-paso.dto';

@Controller('sesion-trabajo-pasos')
export class SesionTrabajoPasoController {
  constructor(private readonly service: SesionTrabajoPasoService) {}

  @Post()
  create(@Body() dto: CreateSesionTrabajoPasoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSesionTrabajoPasoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
