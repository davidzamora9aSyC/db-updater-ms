import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { EstadoMaquinaService } from './estado-maquina.service';
import { CreateEstadoMaquinaDto } from './dto/create-estado-maquina.dto';
import { UpdateEstadoMaquinaDto } from './dto/update-estado-maquina.dto';

@Controller('estados-maquina')
export class EstadoMaquinaController {
  constructor(private readonly service: EstadoMaquinaService) {}

  @Post()
  create(@Body() dto: CreateEstadoMaquinaDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateEstadoMaquinaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
