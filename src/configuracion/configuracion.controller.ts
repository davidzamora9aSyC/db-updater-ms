import { Controller, Get, Put, Body } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly service: ConfiguracionService) {}

  @Get()
  get() {
    return this.service.getConfig();
  }

  @Put()
  update(@Body() dto: UpdateConfiguracionDto) {
    return this.service.update(dto);
  }
}
