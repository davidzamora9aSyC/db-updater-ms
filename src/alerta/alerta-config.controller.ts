import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { UpdateUmbralesAlertaDto } from './dto/update-umbrales-alerta.dto';

@ApiTags('Alertas')
@Controller('alertas/umbrales')
export class AlertaConfigController {
  constructor(private readonly configService: ConfiguracionService) {}

  @Get()
  async getUmbrales() {
    const c = await this.configService.getConfig();
    return {
      maxDescansosDiariosPorTrabajador: c.maxDescansosDiariosPorTrabajador,
      maxDuracionPausaMinutos: c.maxDuracionPausaMinutos,
      minutosInactividadParaNPT: c.minutosInactividadParaNPT,
    };
  }

  @Put()
  async updateUmbrales(@Body() dto: UpdateUmbralesAlertaDto) {
    const updated = await this.configService.update(dto as any);
    return {
      maxDescansosDiariosPorTrabajador: updated.maxDescansosDiariosPorTrabajador,
      maxDuracionPausaMinutos: updated.maxDuracionPausaMinutos,
      minutosInactividadParaNPT: updated.minutosInactividadParaNPT,
    };
  }
}

