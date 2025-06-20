import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('evento')
  handleEvento(@Body() body: any) {
    const { estacion, id, intervalo, distancia, luz } = body;
    if (!estacion || !id) {
      return { error: 'Datos incompletos' };
    }
    if (id === 'tolva') {
      if (intervalo === undefined || distancia === undefined || luz === undefined) {
        return { error: 'Faltan datos para tolva' };
      }
    }
    if (id === 'pedal') {
      if (intervalo === undefined) {
        return { error: 'Falta intervalo para pedal' };
      }
    }
    this.appService.saveEvento(body);
    return { guardado: 1 };
  }

  @Get('sincronizar')
  sincronizar() {
    return { guardado: 1 };
  }

  @Post('impacto')
  handleImpacto(@Body() body: any) {
    const { estacion, id } = body;
    if (!estacion || typeof estacion !== 'string' || estacion.trim() === '') {
      return { error: 'Falta estacion' };
    }
    if (!id) {
      return { error: 'Falta id' };
    }
    if (id !== 'stop' && id !== 'stop-m' && id !== 'continue') {
      return { error: 'ID inválido' };
    }
    this.appService.saveImpacto(body);
    return { guardado: 1 };
  }
}
