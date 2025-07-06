import { Controller, Post, Body } from '@nestjs/common'
import { EventoService } from './evento.service'
import { CrearEventoDto } from './dto/crear-evento.dto'

@Controller('eventos')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Post('pedal')
  registrarPedal(@Body() dto: CrearEventoDto) {
    return this.eventoService.registrar('PEDAL', dto)
  }

  @Post('tolva')
  registrarTolva(@Body() dto: CrearEventoDto) {
    return this.eventoService.registrar('TOLVA', dto)
  }

  @Post('inicio-recurso')
  registrarInicioRecurso(@Body() dto: CrearEventoDto) {
    return this.eventoService.registrar('INICIO_RECURSO', dto)
  }

  @Post('orden')
  registrarInicioOrden(@Body() dto: CrearEventoDto) {
    return this.eventoService.registrar('INICIO_ORDEN', dto)
  }
}