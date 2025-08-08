import { Controller, Get, Param, Post, Body, Put, Delete, Patch } from '@nestjs/common'
import { PasoProduccionService } from './paso-produccion.service'
import { CreatePasoProduccionDto } from './dto/create-paso-produccion.dto'
import { UpdatePasoProduccionDto } from './dto/update-paso-produccion.dto'

@Controller('pasos')
export class PasoProduccionController {
  constructor(private readonly pasoService: PasoProduccionService) {}

  @Post()
  create(@Body() dto: CreatePasoProduccionDto) {
    return this.pasoService.create(dto)
  }

  @Get()
  findAll() {
    return this.pasoService.findAll()
  }

  @Get('/orden/:ordenId')
  findByOrden(@Param('ordenId') ordenId: string) {
    return this.pasoService.findByOrden(ordenId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pasoService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePasoProduccionDto) {
    return this.pasoService.update(id, dto)
  }

  @Patch(':id/finalizar')
  finalizar(@Param('id') id: string) {
    return this.pasoService.finalizar(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pasoService.remove(id)
  }
}