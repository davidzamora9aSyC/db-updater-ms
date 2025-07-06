import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AsignacionService } from './asignacion.service';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';
import { AsignacionIdDto } from './dto/asignacion-id.dto';

@Controller('asignaciones')
export class AsignacionController {
  constructor(private readonly service: AsignacionService) {}

  @Post()
  crear(@Body() dto: CreateAsignacionDto) {
    return this.service.crear(dto);
  }

  @Get(':id')
  obtener(@Param() params: AsignacionIdDto) {
    return this.service.obtenerPorId(params.id);
  }

  @Get()
  listar() {
    return this.service.listar();
  }
}