import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { RegistroMinutoService } from './registro-minuto.service'
import { AcumuladorDto } from './dto/acumulador.dto'

@Controller('registro-minuto')
export class RegistroMinutoController {
  constructor(private readonly service: RegistroMinutoService) {}

  @Post('acumular')
  async acumular(@Body() body: AcumuladorDto) {
    
    const { maquina, pasoSesionTrabajo, tipo, minutoInicio } = body
    await this.service.acumular(maquina, pasoSesionTrabajo, tipo, minutoInicio)
    return { ok: true }
  }

  @Post('guardar')
  async guardar() {
    await this.service.guardarYLimpiar()
    return { ok: true }
  }

  @Get('sesion/:id')
  async obtenerPorSesion(@Param('id') id: string) {
    const registros = await this.service.obtenerPorSesion(id)
    return registros
  }
}