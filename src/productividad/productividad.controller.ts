import { Controller, Get, Query, Param } from '@nestjs/common'
import { ProductividadService } from './productividad.service'
import { FiltroResumenDto } from './dto/filtro-resumen.dto'

@Controller('resumen')
export class ProductividadController {
  constructor(private readonly service: ProductividadService) {}

  @Get('mas-productivos')
  getMasProductivos(@Query() filtro: FiltroResumenDto) {
    return this.service.getMasProductivos(filtro.anio, filtro.mes)
  }

  @Get('resumen-trabajador/:id')
  getResumenTrabajador(@Param('id') id: string) {
    return this.service.getResumenPorTrabajador(id)
  }
}