import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Post('evento')
  handleEvento(@Body() body: any) {
    console.log('POST /evento recibido:', body);
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
    console.log('GET /sincronizar recibido');
    return { guardado: 1 };
  }

  @Post('impacto')
  handleImpacto(@Body() body: any) {
    console.log('POST /impacto recibido:', body);
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


  @Post('minuta')
  handleMinuta(@Body() body: any) {
    console.log('POST /minuta recibido:', body);
    const { accion, fecha, trabajador, orden_produccion, proceso, cantidad_piezas, meta, npt_min } = body;

    if (!accion || !fecha || !proceso) {
      return { error: 'Datos incompletos' };
    }

    if (accion === 'Terminar turno') {
      if (cantidad_piezas === undefined || meta === undefined || npt_min === undefined) {
        return { error: 'Faltan datos para terminar turno' };
      }

      const cumplimiento = (cantidad_piezas / meta) * 100;
      const turnoMinutos = 480; // asumimos turno de 8 horas
      const porcentajeNPT = (npt_min / turnoMinutos) * 100;

      console.log(`% cumplimiento: ${cumplimiento.toFixed(2)}%`);
      console.log(`% NPT: ${porcentajeNPT.toFixed(2)}%`);
    }

    this.appService.saveMinuta(body);
    return { guardado: 1 };
  }

}