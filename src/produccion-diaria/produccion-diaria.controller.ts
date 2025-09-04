import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProduccionDiariaService } from './produccion-diaria.service';

@ApiTags('ProduccionDiaria')
@Controller('produccion')
export class ProduccionDiariaController {
  constructor(private readonly service: ProduccionDiariaService) {}

  @Get('diaria/mes-actual')
  obtenerProduccionDiariaMesActual(@Query('areaId') areaId?: string) {
    return this.service.obtenerProduccionDiariaMesActual(areaId);
  }

  @Get('diaria/ultimos-30-dias')
  obtenerProduccionDiariaUltimos30Dias(@Query('areaId') areaId?: string) {
    return this.service.obtenerProduccionDiariaUltimos30Dias(areaId);
  }

  @Get('mensual/ano-actual')
  obtenerProduccionMensualAnoActual(@Query('areaId') areaId?: string) {
    return this.service.obtenerProduccionMensualAnoActual(areaId);
  }

  @Get('mensual/ultimos-12-meses')
  obtenerProduccionMensualUltimos12Meses(@Query('areaId') areaId?: string) {
    return this.service.obtenerProduccionMensualUltimos12Meses(areaId);
  }
}
