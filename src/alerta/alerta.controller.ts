import { Controller, Get, Param, Query } from '@nestjs/common';
import { AlertaService, GetAlertasQuery } from './alerta.service';

@Controller('alertas')
export class AlertaController {
  constructor(private readonly alertaService: AlertaService) {}

  @Get()
  async getAlertas(@Query() query: GetAlertasQuery) {
    return this.alertaService.getAlertas(query);
  }

  // Alertas por trabajador en rango de fechas
  @Get('trabajador/rango')
  async getAlertasTrabajadorRango(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Query('trabajadorId') trabajadorId?: string,
    @Query('identificacion') identificacion?: string,
  ) {
    return this.alertaService.getAlertasTrabajadorRango({ desde, hasta, trabajadorId, identificacion });
  }
}
