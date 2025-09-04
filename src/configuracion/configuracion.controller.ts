import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfiguracionService } from './configuracion.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

@ApiTags('Configuracion')
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
