import { Controller, Post, Get, Param, Body, Put, Delete, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';
import { Public } from '../auth/public.decorator'


@ApiTags('Sesiones')
@Controller('sesiones-trabajo')
export class SesionTrabajoController {
  constructor(
    private readonly service: SesionTrabajoService,
  ) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Crear sesiÃ³n de trabajo' })
  async create(
    @Body() dto: CreateSesionTrabajoDto,
    @Query('esp32') esp32?: string,
  ) {
    const sesion = await this.service.create(dto);
    if (esp32 === 'true') return sesion.id;
    return sesion;
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todas las sesiones' })
  findAll() {
    return this.service.findAll();
  }

  @Get('actuales')
  @Public()
  @ApiOperation({ summary: 'Listar sesiones actuales con indicadores rÃ¡pidos' })
  findActuales() {
    return this.service.findActuales();
  }

  @Get('activas')
  @ApiOperation({ summary: 'Listar sesiones activas' })
  @ApiQuery({ name: 'trabajador', required: false, description: 'Filtrar por ID de trabajador' })
  @Public()
  findActivas(@Query('trabajador') trabajador?: string) {
    return this.service.findActivas(trabajador);
  }

  @Get('activas/resumen')
  @Public()
  @ApiOperation({ summary: 'Resumen de sesiones activas (ligero)' })
  findActivasResumen() {
    return this.service.findActivasResumen();
  }

  @Get(':id/orden-produccion')
  @Public()
  @ApiOperation({ summary: 'Obtener orden/paso activo de una sesiÃ³n' })
  findOrdenProduccion(@Param('id') id: string) {
    return this.service.findOrdenProduccion(id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener una sesiÃ³n con Ãºltimo indicador' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Serie minuto a minuto de una sesiÃ³n (velocidad ventana y otros)
  @Get(':id/serie-minuto')
  @Public()
  @ApiOperation({ summary: 'Serie minuto a minuto de una sesiÃ³n (velocidad 10m y mÃ©tricas)' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la sesiÃ³n' })
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
  @ApiOperation({ summary: 'Actualizar sesiÃ³n' })
  update(@Param('id') id: string, @Body() dto: UpdateSesionTrabajoDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/finalizar')
  @Public()
  @ApiOperation({ summary: 'Finalizar sesiÃ³n' })
  finalizar(@Param('id') id: string) {
    return this.service.finalizar(id);
  }

  @Post('finalizar-todas')
  @ApiOperation({ summary: 'Finalizar todas las sesiones activas' })
  finalizarTodas() {
    return this.service.finalizarTodas();
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar sesiÃ³n' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Public()
  @Get('maquina/:id/activa')
  @ApiOperation({ summary: 'Obtener sesiÃ³n activa por mÃ¡quina' })
  async findSesionActiva(
    @Param('id') id: string,
    @Query('esp32') esp32?: string,
  ) {
    const sesion = await this.service.findByMaquina(id);
    if (esp32 === 'true') return sesion.id;
    return sesion;
  }

  @Get('maquina/:id/rango')
  @Public()
  @ApiOperation({ summary: 'Listar sesiones de una mÃ¡quina en un rango de fechas (por fechaInicio)' })
  async findSesionesPorMaquinaEnRango(
    @Param('id') id: string,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.service.findPorMaquinaEnRango(id, desde, hasta);
  }

}


