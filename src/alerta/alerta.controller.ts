import { Controller, Get, Query } from '@nestjs/common';
import { AlertaService, GetAlertasQuery } from './alerta.service';

@Controller('alertas')
export class AlertaController {
  constructor(private readonly alertaService: AlertaService) {}

  @Get()
  async getAlertas(@Query() query: GetAlertasQuery) {
    return this.alertaService.getAlertas(query);
  }
}

