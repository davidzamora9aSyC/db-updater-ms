import { Controller, Get, Post, Put, Patch, Param, Body } from '@nestjs/common';
import { TrabajadorService } from './trabajador.service';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';

@Controller('trabajadores')
export class TrabajadorController {
  constructor(private readonly service: TrabajadorService) {}

  @Post()
  crear(@Body() body: CreateTrabajadorDto) {
    return this.service.crear(body);
  }

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.service.obtener(id);
  }

  @Put(':id')
  actualizar(@Param('id') id: string, @Body() body: UpdateTrabajadorDto) {
    return this.service.actualizar(id, body);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body('estado') estado: boolean) {
    return this.service.cambiarEstado(id, estado);
  }
}