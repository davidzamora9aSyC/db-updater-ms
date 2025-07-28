import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common';
import { EstadoSesionService } from './estado-sesion.service';
import { CreateEstadoSesionDto } from './dto/create-estado-sesion.dto';
import { UpdateEstadoSesionDto } from './dto/update-estado-sesion.dto';

@Controller('estados-sesion')
export class EstadoSesionController {
  constructor(private readonly service: EstadoSesionService) {}

  @Post()
  create(@Body() dto: CreateEstadoSesionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('por-sesion/:sesionId')
  findBySesion(@Param('sesionId') sesionId: string) {
    return this.service.findBySesion(sesionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEstadoSesionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete('por-sesion/:sesionId')
  removeBySesion(@Param('sesionId') sesionId: string) {
    return this.service.removeBySesion(sesionId);
  }
}
