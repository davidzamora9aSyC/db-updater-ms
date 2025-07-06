import { Controller, Get, Post, Param, Body } from '@nestjs/common'
import { MinutaService } from './minuta.service'
import { CreateMinutaDto } from './dto/create-minuta.dto'

@Controller('minutas')
export class MinutaController {
  constructor(private readonly service: MinutaService) {}

  @Post()
  create(@Body() dto: CreateMinutaDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }
}