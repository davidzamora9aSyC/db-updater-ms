import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { OrdenProduccionService } from './orden-produccion.service'
import { CrearOrdenDto } from './dto/crear-orden.dto'
import { ActualizarOrdenDto } from './dto/actualizar-orden.dto'

@ApiTags('Ordenes')
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

  @Get(':id/pasos-mini')
  obtenerPasosMini(@Param('id') id: string) {
    return this.service.obtenerPasosMini(id);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }

  @Get(':id/detalle')
  obtenerDetalle(@Param('id') id: string) {
    return this.service.obtenerDetalle(id)
  }
}
