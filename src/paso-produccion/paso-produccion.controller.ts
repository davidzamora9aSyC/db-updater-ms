import { Controller, Get, Param } from '@nestjs/common'
import { PasoProduccionService } from './paso-produccion.service'

@Controller('pasos')
export class PasoProduccionController {
  constructor(private readonly pasoService: PasoProduccionService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pasoService.findOne(id)
  }
}