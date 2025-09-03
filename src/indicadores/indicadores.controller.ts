import { Controller, Get, Query } from '@nestjs/common';
import { IndicadoresService } from './indicadores.service';

@Controller('indicadores')
export class IndicadoresController {
  constructor(private readonly service: IndicadoresService) {}

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
}

