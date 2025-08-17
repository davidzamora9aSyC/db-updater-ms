import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { EstadoTrabajadorService } from './estado-trabajador.service';
import { CreateEstadoTrabajadorDto } from './dto/create-estado-trabajador.dto';
import { UpdateEstadoTrabajadorDto } from './dto/update-estado-trabajador.dto';

@Controller('estados-trabajador')
export class EstadoTrabajadorController {
  constructor(private readonly service: EstadoTrabajadorService) {}

  @Post()
  create(@Body() dto: CreateEstadoTrabajadorDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('trabajador/:id')
  findByTrabajador(@Param('id') id: string) {
    return this.service.findByTrabajador(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEstadoTrabajadorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
