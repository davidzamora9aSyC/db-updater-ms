import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common'
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pasoService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePasoProduccionDto) {
    return this.pasoService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pasoService.remove(id)
  }
}