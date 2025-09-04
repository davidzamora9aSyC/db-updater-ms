import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IndicadoresService } from './indicadores.service';
import { SesionTrabajoService } from '../sesion-trabajo/sesion-trabajo.service';

@ApiTags('Indicadores')
@Controller('indicadores')
export class IndicadoresController {
  constructor(
    private readonly service: IndicadoresService,
    private readonly sesionService: SesionTrabajoService,
  ) {}

  @Get('diaria/mes-actual')
  @ApiOperation({ summary: 'Serie diaria del mes actual (por área opcional)' })
  diariaMesActual(@Query('areaId') areaId?: string) {
    return this.service.obtenerDiariaMesActual(areaId);
  }

  @Get('diaria/ultimos-30-dias')
  @ApiOperation({ summary: 'Serie diaria de últimos 30 días (por área opcional)' })
  diariaUltimos30Dias(@Query('areaId') areaId?: string) {
    return this.service.obtenerDiariaUltimos30Dias(areaId);
  }

  @Get('mensual/ano-actual')
  @ApiOperation({ summary: 'Serie mensual del año actual (por área opcional)' })
  mensualAnoActual(@Query('areaId') areaId?: string) {
    return this.service.obtenerMensualAnoActual(areaId);
  }

  @Get('mensual/ultimos-12-meses')
  @ApiOperation({ summary: 'Serie mensual de los últimos 12 meses (por área opcional)' })
  mensualUltimos12Meses(@Query('areaId') areaId?: string) {
    return this.service.obtenerMensualUltimos12Meses(areaId);
  }

  // Resúmenes útiles para tarjetas del dashboard
  @Get('resumen/dia')
  @ApiOperation({ summary: 'Resumen por día (por áreas)' })
  resumenDia(@Query('fecha') fecha?: string) {
    return this.service.resumenPorDia(fecha);
  }

  @Get('resumen/mes-actual')
  @ApiOperation({ summary: 'Resumen del mes actual (por áreas)' })
  resumenMesActual() {
    return this.service.resumenMesActual();
  }

  // Tiempo real: velocidad por área (suma o promedio)
  @Get('realtime/area-velocidad')
  @ApiOperation({ summary: 'Velocidad de ventana (10m) por área en tiempo real' })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiQuery({ name: 'mode', required: false, description: 'sum | avg', example: 'sum' })
  velocidadAreaTiempoReal(
    @Query('areaId') areaId?: string,
    @Query('mode') mode: 'sum' | 'avg' = 'sum',
  ) {
    return this.sesionService.velocidadAreaTiempoReal(areaId, mode);
  }

  // Velocidad normalizada por sesiones en un rango (general o por área)
  @Get('sesiones/velocidad-normalizada')
  @ApiOperation({ summary: 'Curva promedio normalizada de velocidad de ventana por sesiones en rango' })
  @ApiQuery({ name: 'inicio', required: true, description: 'Fecha/ISO inicio' })
  @ApiQuery({ name: 'fin', required: true, description: 'Fecha/ISO fin' })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiQuery({ name: 'points', required: false, example: 50 })
  @ApiOkResponse({ description: 'Curva mean normalizada', schema: { example: {
    inicio: '2025-09-01', fin: '2025-09-04', areaId: 'a1', points: 50, sesiones: 37,
    mean: [120.0, 122.5, 125.1, 130.3, 140.9]
  } } })
  velocidadNormalizada(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('areaId') areaId?: string,
    @Query('points') points = '50',
  ) {
    return this.sesionService.velocidadNormalizadaRango(
      inicio,
      fin,
      areaId,
      Number(points) || 50,
    );
  }

  // Resumen por trabajador en rango (opcional incluir ventana)
  @Get('trabajadores/:id/resumen')
  @ApiOperation({ summary: 'Resumen de métricas por trabajador en rango' })
  @ApiParam({ name: 'id', required: true })
  @ApiQuery({ name: 'inicio', required: true })
  @ApiQuery({ name: 'fin', required: true })
  @ApiQuery({ name: 'includeVentana', required: false, example: 'false' })
  resumenTrabajador(
    @Param('id') id: string,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('includeVentana') includeVentana = 'false',
  ) {
    return this.sesionService.resumenTrabajadorRango(
      id,
      inicio,
      fin,
      includeVentana === 'true',
    );
  }

  // Resumen por máquina en rango (opcional incluir ventana)
  @Get('maquinas/:id/resumen')
  @ApiOperation({ summary: 'Resumen de métricas por máquina en rango' })
  @ApiParam({ name: 'id', required: true })
  @ApiQuery({ name: 'inicio', required: true })
  @ApiQuery({ name: 'fin', required: true })
  @ApiQuery({ name: 'includeVentana', required: false, example: 'false' })
  resumenMaquina(
    @Param('id') id: string,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('includeVentana') includeVentana = 'false',
  ) {
    return this.sesionService.resumenMaquinaRango(
      id,
      inicio,
      fin,
      includeVentana === 'true',
    );
  }

  // Listado de trabajadores con métricas agregadas en rango o rango predefinido
  @Get('trabajadores')
  @ApiOperation({ summary: 'Listado de trabajadores con métricas (rango predefinido o fechas)' })
  @ApiQuery({ name: 'rango', required: false, description: 'hoy, semana, mes, ultimos-30-dias, ano, ultimos-12-meses' })
  @ApiQuery({ name: 'inicio', required: false })
  @ApiQuery({ name: 'fin', required: false })
  @ApiQuery({ name: 'metrics', required: false, description: 'Lista separada por comas de métricas a incluir' })
  listarTrabajadores(
    @Query('rango') rango?: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
    @Query('metrics') metrics?: string,
  ) {
    return this.service.listarTrabajadores({ rango, inicio, fin, metrics });
  }

  // Listado de máquinas con métricas agregadas en rango o rango predefinido
  @Get('maquinas')
  @ApiOperation({ summary: 'Listado de máquinas con métricas (rango predefinido o fechas)' })
  @ApiQuery({ name: 'rango', required: false })
  @ApiQuery({ name: 'inicio', required: false })
  @ApiQuery({ name: 'fin', required: false })
  @ApiQuery({ name: 'metrics', required: false })
  listarMaquinas(
    @Query('rango') rango?: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
    @Query('metrics') metrics?: string,
  ) {
    return this.service.listarMaquinas({ rango, inicio, fin, metrics });
  }
}
