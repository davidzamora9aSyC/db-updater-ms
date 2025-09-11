import { Controller, Post, Get, Param, Body, Put, Delete, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';


@ApiTags('Sesiones')
@Controller('sesiones-trabajo')
export class SesionTrabajoController {
  constructor(
    private readonly service: SesionTrabajoService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear sesión de trabajo' })
  async create(
    @Body() dto: CreateSesionTrabajoDto,
    @Query('esp32') esp32?: string,
  ) {
    const sesion = await this.service.create(dto);
    if (esp32 === 'true') return sesion.id;
    return sesion;
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las sesiones' })
  findAll() {
    return this.service.findAll();
  }

  @Get('actuales')
  @ApiOperation({ summary: 'Listar sesiones actuales con indicadores rápidos' })
  findActuales() {
    return this.service.findActuales();
  }

  @Get('activas')
  @ApiOperation({ summary: 'Listar sesiones activas' })
  findActivas() {
    return this.service.findActivas();
  }

  @Get('activas/resumen')
  @ApiOperation({ summary: 'Resumen de sesiones activas (ligero)' })
  findActivasResumen() {
    return this.service.findActivasResumen();
  }

  @Get(':id/orden-produccion')
  @ApiOperation({ summary: 'Obtener orden/paso activo de una sesión' })
  findOrdenProduccion(@Param('id') id: string) {
    return this.service.findOrdenProduccion(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una sesión con último indicador' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Serie minuto a minuto de una sesión (velocidad ventana y otros)
  @Get(':id/serie-minuto')
  @ApiOperation({ summary: 'Serie minuto a minuto de una sesión (velocidad 10m y métricas)' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la sesión' })
  @ApiQuery({ name: 'inicio', required: false, description: 'ISO inicio (opcional)' })
  @ApiQuery({ name: 'fin', required: false, description: 'ISO fin (opcional)' })
  @ApiOkResponse({ description: 'Serie ordenada por minuto', schema: { example: [
    {
      sesionTrabajoId: '0c33f9fc-...',
      minuto: '2025-09-04T14:30:00.000Z',
      velocidadActual: 180,
      avgSpeed: 165.2,
      avgSpeedSesion: 142.7,
      produccionTotal: 240,
      defectos: 8,
      porcentajeDefectos: 3.23,
      nptMin: 12,
      nptPorInactividad: 8,
      porcentajeNPT: 9.02,
      pausasCount: 1,
      pausasMin: 5,
      porcentajePausa: 3.76,
      duracionSesionMin: 133,
      actualizadoEn: '2025-09-04T14:30:10.000Z'
    }
  ] } })
  async serieMinuto(
    @Param('id') id: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ) {
    return this.service.serieMinutoPorSesion(id, inicio, fin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar sesión' })
  update(@Param('id') id: string, @Body() dto: UpdateSesionTrabajoDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/finalizar')
  @ApiOperation({ summary: 'Finalizar sesión' })
  finalizar(@Param('id') id: string) {
    return this.service.finalizar(id);
  }

  @Post('finalizar-todas')
  @ApiOperation({ summary: 'Finalizar todas las sesiones activas' })
  finalizarTodas() {
    return this.service.finalizarTodas();
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar sesión' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('maquina/:id/activa')
  @ApiOperation({ summary: 'Obtener sesión activa por máquina' })
  async findSesionActiva(
    @Param('id') id: string,
    @Query('esp32') esp32?: string,
  ) {
    const sesion = await this.service.findByMaquina(id);
    if (esp32 === 'true') return sesion.id;
    return sesion;
  }

  @Get('maquina/:id/rango')
  @ApiOperation({ summary: 'Listar sesiones de una máquina en un rango de fechas (por fechaInicio)' })
  async findSesionesPorMaquinaEnRango(
    @Param('id') id: string,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.service.findPorMaquinaEnRango(id, desde, hasta);
  }

}
