import { Controller, Post } from '@nestjs/common'
import { BotonService } from './boton.service'

@Controller('botones')
export class BotonController {
  constructor(private readonly botonService: BotonService) {}

  @Post('descanso')
  registrarDescanso() {
    return this.botonService.registrarDescanso()
  }

  @Post('mantenimiento')
  registrarMantenimiento() {
    return this.botonService.registrarMantenimiento()
  }

  @Post('volver')
  registrarVolver() {
    return this.botonService.registrarVolver()
  }
}