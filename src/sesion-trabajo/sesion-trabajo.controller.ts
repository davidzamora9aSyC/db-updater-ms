import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';

@Controller('sesiones-trabajo')
export class SesionTrabajoController {
  constructor(private readonly service: SesionTrabajoService) {}

  @Post()
  create(@Body() dto: CreateSesionTrabajoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('actuales')
  findActuales() {
    return this.service.findActuales();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSesionTrabajoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
