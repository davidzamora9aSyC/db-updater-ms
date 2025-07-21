import { Controller, Post, Body } from '@nestjs/common'
import { RegistroMinutoService } from './registro-minuto.service'
import { CreateRegistroMinutoDto } from './dto/create-registro-minuto.dto'

@Controller('registro-minuto')
export class RegistroMinutoController {
  constructor(private readonly service: RegistroMinutoService) {}

  @Post('acumular')
  acumular(@Body() body: CreateRegistroMinutoDto) {
    const { sesionTrabajo, pedaleadas, piezasContadas, minutoInicio } = body
    this.service.acumular(sesionTrabajo, pedaleadas, piezasContadas, minutoInicio)
    return { ok: true }
  }

  @Post('guardar')
  async guardar() {
    await this.service.guardarYLimpiar()
    return { ok: true }
  }
}