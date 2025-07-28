import { Controller, Post, Body } from '@nestjs/common'
import { RegistroMinutoService } from './registro-minuto.service'
import { CreateRegistroMinutoDto } from './dto/create-registro-minuto.dto'
import { AcumuladorDto } from './dto/acumulador.dto'

@Controller('registro-minuto')
export class RegistroMinutoController {
  constructor(private readonly service: RegistroMinutoService) {}

  @Post('acumular')
  async acumular(@Body() body: AcumuladorDto) {
    const { sesionTrabajo, tipo, minutoInicio } = body
    await this.service.acumular(sesionTrabajo, tipo, minutoInicio)
    return { ok: true }
  }

  @Post('guardar')
  async guardar() {
    await this.service.guardarYLimpiar()
    return { ok: true }
  }
}