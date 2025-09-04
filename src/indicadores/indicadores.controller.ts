import { Controller, Get, Param, Query } from '@nestjs/common';
import { IndicadoresService } from './indicadores.service';
import { SesionTrabajoService } from '../sesion-trabajo/sesion-trabajo.service';

@Controller('indicadores')
export class IndicadoresController {
  constructor(
    private readonly service: IndicadoresService,
    private readonly sesionService: SesionTrabajoService,
  ) {}

  @Get('diaria/mes-actual')
  diariaMesActual(@Query('areaId') areaId?: string) {
    return this.service.obtenerDiariaMesActual(areaId);
  }

  @Get('diaria/ultimos-30-dias')
  diariaUltimos30Dias(@Query('areaId') areaId?: string) {
    return this.service.obtenerDiariaUltimos30Dias(areaId);
  }

  @Get('mensual/ano-actual')
  mensualAnoActual(@Query('areaId') areaId?: string) {
    return this.service.obtenerMensualAnoActual(areaId);
  }

  @Get('mensual/ultimos-12-meses')
  mensualUltimos12Meses(@Query('areaId') areaId?: string) {
    return this.service.obtenerMensualUltimos12Meses(areaId);
  }

  // Resúmenes útiles para tarjetas del dashboard
  @Get('resumen/dia')
  resumenDia(@Query('fecha') fecha?: string) {
    return this.service.resumenPorDia(fecha);
  }

  @Get('resumen/mes-actual')
  resumenMesActual() {
    return this.service.resumenMesActual();
  }

  // Tiempo real: velocidad por área (suma o promedio)
  @Get('realtime/area-velocidad')
  velocidadAreaTiempoReal(
    @Query('areaId') areaId?: string,
    @Query('mode') mode: 'sum' | 'avg' = 'sum',
  ) {
    return this.sesionService.velocidadAreaTiempoReal(areaId, mode);
  }

  // Velocidad normalizada por sesiones en un rango (general o por área)
  @Get('sesiones/velocidad-normalizada')
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
}
