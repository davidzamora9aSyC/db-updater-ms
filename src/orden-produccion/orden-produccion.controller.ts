import { Controller, Post, Get, Param, Patch, Body } from '@nestjs/common'
import { OrdenProduccionService } from './orden-produccion.service'
import { CrearOrdenDto } from './dto/crear-orden.dto'
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto'

@Controller('ordenes')
export class OrdenProduccionController {
  constructor(private readonly service: OrdenProduccionService) {}

  @Post()
  crear(@Body() dto: CrearOrdenDto) {
    return this.service.crear(dto)
  }

  @Get()
  obtenerTodas() {
    return this.service.obtenerTodas()
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.service.obtenerPorId(id)
  }

  @Get(':id/pasos')
  obtenerPasos(@Param('id') id: string) {
    return this.service.obtenerPasos(id)
  }

  @Patch(':id/progreso')
  actualizarProgreso(@Param('id') id: string, @Body() dto: ActualizarProgresoDto) {
    return this.service.actualizarProgreso(id, dto)
  }
}