import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common';
import { EstadoRecursoService } from './estado-recurso.service';
import { CreateEstadoRecursoDto } from './dto/create-estado-recurso.dto';
import { UpdateEstadoRecursoDto } from './dto/update-estado-recurso.dto';

@Controller('estados-recurso')
export class EstadoRecursoController {
  constructor(private readonly service: EstadoRecursoService) {}

  @Post()
  create(@Body() dto: CreateEstadoRecursoDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateEstadoRecursoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
