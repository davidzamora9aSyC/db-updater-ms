import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common'
import { OrdenProduccionService } from './orden-produccion.service'
import { CrearOrdenDto } from './dto/crear-orden.dto'
import { ActualizarOrdenDto } from './dto/actualizar-orden.dto'

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

  @Put(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarOrdenDto) {
    return this.service.actualizar(id, dto)
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.service.eliminar(id)
  }
}