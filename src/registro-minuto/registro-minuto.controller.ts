import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { RegistroMinutoService } from './registro-minuto.service';
import { AcumuladorDto } from './dto/acumulador.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('RegistroMinuto')
@Controller('registro-minuto')
export class RegistroMinutoController {
  constructor(private readonly service: RegistroMinutoService) {}

  @Post('acumular')
  @Public()
  @ApiBody({ type: AcumuladorDto })
  async acumular(@Body() body: AcumuladorDto) {
    const { maquina, paso, tipo, minutoInicio } = body;
    await this.service.acumular(maquina, paso, tipo, minutoInicio);
    return { ok: true };
  }

  @Post('guardar')
  @Public()
  async guardar() {
    await this.service.guardarYLimpiar();
    return { ok: true };
  }

  @Get('sesion/:id')
  @Public()
  async obtenerPorSesion(@Param('id') id: string) {
    const registros = await this.service.obtenerPorSesion(id);
    return registros;
  }

  @Get('sesion/:id/ultimos')
  @Public()
  async obtenerUltimos(@Param('id') id: string) {
    const registros = await this.service.obtenerUltimosMinutos(id, 120);
    return registros;
  }
}
