import { Controller, Post, Get, Put, Param, Body, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MaquinaService } from './maquina.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';

@ApiTags('Maquinas')
@Controller('maquinas')
export class MaquinaController {
  constructor(private readonly maquinaService: MaquinaService) {}

  @Post()
  create(@Body() dto: CreateMaquinaDto) {
    return this.maquinaService.create(dto);
  }

  @Get()
  findAll() {
    return this.maquinaService.findAll();
  }

  // Buscar máquinas por nombre/código y/o por área
  @Get('buscar')
  @ApiOperation({ summary: 'Buscar máquinas por nombre/código y/o área' })
  @ApiQuery({ name: 'q', required: false, description: 'Texto libre: nombre o código' })
  @ApiQuery({ name: 'nombre', required: false })
  @ApiQuery({ name: 'areaId', required: false, description: 'UUID de área' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  buscar(
    @Query('q') q?: string,
    @Query('nombre') nombre?: string,
    @Query('areaId') areaId?: string,
    @Query('limit') limit = '20',
  ) {
    return this.maquinaService.buscar({ q, nombre, areaId, limit: Number(limit) || 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maquinaService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaquinaDto) {
    return this.maquinaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maquinaService.remove(id);
  }

}
