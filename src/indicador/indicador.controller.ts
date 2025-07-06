import { Controller, Get, Param } from '@nestjs/common';
import { IndicadorService } from './indicador.service';

@Controller('indicadores')
export class IndicadorController {
  constructor(private readonly indicadorService: IndicadorService) {}

  @Get('globales')
  getGlobales() {
    return this.indicadorService.getGlobales();
  }

  @Get(':recursoId')
  getPorRecurso(@Param('recursoId') recursoId: string) {
    return this.indicadorService.getPorRecurso(recursoId);
  }

  @Get('minuto/:recursoId')
  getPorMinuto(@Param('recursoId') recursoId: string) {
    return this.indicadorService.getPorMinuto(recursoId);
  }
}