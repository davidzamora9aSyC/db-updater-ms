import { Controller, Get, Post, Put, Param, Body, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TrabajadorService } from './trabajador.service';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';

@ApiTags('Trabajadores')
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

  // Buscar por nombre o identificación
  @Get('buscar')
  @ApiOperation({ summary: 'Buscar trabajadores por nombre o identificación' })
  @ApiQuery({ name: 'q', required: false, description: 'Texto libre: nombre o identificación' })
  @ApiQuery({ name: 'nombre', required: false })
  @ApiQuery({ name: 'identificacion', required: false })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  buscar(
    @Query('q') q?: string,
    @Query('nombre') nombre?: string,
    @Query('identificacion') identificacion?: string,
    @Query('limit') limit = '20',
  ) {
    return this.service.buscar({ q, nombre, identificacion, limit: Number(limit) || 20 });
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

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id);
  }
}
