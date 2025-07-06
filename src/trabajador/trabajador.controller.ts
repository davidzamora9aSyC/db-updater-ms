import { Controller, Get, Post, Put, Patch, Param, Body } from '@nestjs/common';
import { TrabajadorService } from './trabajador.service';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';

@Controller('trabajadores')
export class TrabajadorController {
  constructor(private readonly service: TrabajadorService) {}

  // Crea un nuevo trabajador
  @Post()
  crear(@Body() body: CreateTrabajadorDto) {
    return this.service.crear(body);
  }

  // Lista todos los trabajadores
  @Get()
  listar() {
    return this.service.listar();
  }

  // Obtiene un trabajador por su ID
  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.service.obtener(id);
  }

  // Actualiza completamente un trabajador por su ID
  @Put(':id')
  actualizar(@Param('id') id: string, @Body() body: UpdateTrabajadorDto) {
    return this.service.actualizar(id, body);
  }

  // Cambia el estado (activo/inactivo) de un trabajador por su ID
  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body('estado') estado: boolean) {
    return this.service.cambiarEstado(id, estado);
  }
}