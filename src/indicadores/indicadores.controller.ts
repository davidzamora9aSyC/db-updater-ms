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

  @Get('producto')
  @ApiOperation({ summary: 'Indicadores agregados por producto' })
  @ApiQuery({ name: 'productoId', required: false, description: 'Identificador o etiqueta del producto (Orden.producto)' })
  @ApiQuery({ name: 'producto', required: false, description: 'Alias del producto si no se pasa productoId' })
  @ApiQuery({ name: 'periodo', required: false, description: 'diario | semanal | mensual' })
  @ApiQuery({ name: 'inicio', required: false, description: 'Fecha inicio ISO (junto con fin)' })
  @ApiQuery({ name: 'fin', required: false, description: 'Fecha fin ISO (junto con inicio)' })
  @ApiQuery({
    name: 'compararCon',
    required: false,
    description: 'previo | mismoPeriodoAnterior | personalizado | ninguno',
  })
  @ApiQuery({ name: 'compararInicio', required: false, description: 'Inicio ISO para comparación personalizada' })
  @ApiQuery({ name: 'compararFin', required: false, description: 'Fin ISO para comparación personalizada' })
  @ApiQuery({ name: 'targetNc', required: false, description: 'Objetivo de porcentaje de no conformes' })
  @ApiQuery({ name: 'targetNpt', required: false, description: 'Objetivo de NPT (horas)' })
  @ApiQuery({
    name: 'targetCumplimiento',
    required: false,
    description: 'Objetivo de cumplimiento como relación (0-1)',
  })
  indicadoresPorProducto(
    @Query('productoId') productoId?: string,
    @Query('producto') producto?: string,
    @Query('periodo') periodo?: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
    @Query('compararCon') compararCon?: string,
    @Query('compararInicio') compararInicio?: string,
    @Query('compararFin') compararFin?: string,
    @Query('targetNc') targetNc?: string,
    @Query('targetNpt') targetNpt?: string,
    @Query('targetCumplimiento') targetCumplimiento?: string,
  ) {
    const toNumber = (value?: string) => {
      if (value === undefined || value === null || value === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    return this.service.indicadoresPorProducto({
      producto: productoId ?? producto ?? '',
      periodo,
      inicio,
      fin,
      compararCon,
      compararInicio,
      compararFin,
      targetNc: toNumber(targetNc),
      targetNpt: toNumber(targetNpt),
      targetCumplimiento: toNumber(targetCumplimiento),
    });
  }

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

  // Tiempo real: serie promedio normalizada por área (día actual)
  @Get('realtime/area-velocidad')
  @ApiOperation({ summary: 'Serie promedio normalizada (ventana 10m) del día por área' })
  @ApiQuery({ name: 'areaId', required: false })
  velocidadAreaTiempoReal(
    @Query('areaId') areaId?: string,
  ) {
    return this.sesionService.velocidadAreaTiempoReal(areaId);
  }

  // Velocidad normalizada por sesiones en un rango (general o por área)
  @Get('sesiones/velocidad-normalizada')
  @ApiOperation({ summary: 'Curva promedio (longitud normalizada) con velocidades normalizadas por sesión' })
  @ApiQuery({ name: 'inicio', required: true, description: 'Fecha/ISO inicio' })
  @ApiQuery({ name: 'fin', required: true, description: 'Fecha/ISO fin' })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiQuery({ name: 'points', required: false, example: 50 })
  @ApiOkResponse({ description: 'Curva promedio de velocidades normalizadas', schema: { example: {
    inicio: '2025-09-01', fin: '2025-09-04', areaId: 'a1', points: 50, sesiones: 37,
    mean: [0.95, 1.02, 1.08, 1.05, 0.98], normalizacion: 'mean-per-sesion'
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
  @ApiQuery({
    name: 'compararCon',
    required: false,
    description: 'previo (default), mismo-periodo-anterior, personalizado, ninguno',
  })
  @ApiQuery({ name: 'compararInicio', required: false })
  @ApiQuery({ name: 'compararFin', required: false })
  listarTrabajadores(
    @Query('rango') rango?: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
    @Query('metrics') metrics?: string,
    @Query('compararCon') compararCon?: string,
    @Query('compararInicio') compararInicio?: string,
    @Query('compararFin') compararFin?: string,
  ) {
    return this.service.listarTrabajadores({
      rango,
      inicio,
      fin,
      metrics,
      compararCon,
      compararInicio,
      compararFin,
    });
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

  // Serie diaria por trabajador en rango o rango predefinido
  @Get('trabajadores/:id/diaria')
  @ApiOperation({ summary: 'Serie diaria de métricas por trabajador' })
  @ApiParam({ name: 'id', required: true })
  @ApiQuery({ name: 'rango', required: false, description: 'hoy, semana, mes, ultimos-30-dias, ano, ultimos-12-meses' })
  @ApiQuery({ name: 'inicio', required: false })
  @ApiQuery({ name: 'fin', required: false })
  diariaTrabajador(
    @Param('id') id: string,
    @Query('rango') rango?: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ) {
    return this.service.diariaPorTrabajador(id, { rango, inicio, fin });
  }

  // Serie diaria por máquina en rango o rango predefinido
  @Get('maquinas/:id/diaria')
  @ApiOperation({ summary: 'Serie diaria de métricas por máquina' })
  @ApiParam({ name: 'id', required: true })
  @ApiQuery({ name: 'rango', required: false, description: 'hoy, semana, mes, ultimos-30-dias, ano, ultimos-12-meses' })
  @ApiQuery({ name: 'inicio', required: false })
  @ApiQuery({ name: 'fin', required: false })
  diariaMaquina(
    @Param('id') id: string,
    @Query('rango') rango?: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ) {
    return this.service.diariaPorMaquina(id, { rango, inicio, fin });
  }
}
