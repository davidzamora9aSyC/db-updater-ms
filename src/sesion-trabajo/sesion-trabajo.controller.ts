import { Controller, Post, Get, Param, Body, Put, Delete, Patch, Query } from '@nestjs/common';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { CreateSesionTrabajoDto } from './dto/create-sesion-trabajo.dto';
import { UpdateSesionTrabajoDto } from './dto/update-sesion-trabajo.dto';
import { IndicadorSesionMinutoService } from '../indicador-sesion-minuto/indicador-sesion-minuto.service';


@Controller('sesiones-trabajo')
export class SesionTrabajoController {
  constructor(
    private readonly service: SesionTrabajoService,
    private readonly indicadorMinutoService: IndicadorSesionMinutoService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateSesionTrabajoDto,
    @Query('esp32') esp32?: string,
  ) {
    const sesion = await this.service.create(dto);
    if (esp32 === 'true') return sesion.id;
    return sesion;
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('actuales')
  findActuales() {
    return this.service.findActuales();
  }

  @Get('activas')
  findActivas() {
    return this.service.findActivas();
  }

  @Get('activas/resumen')
  findActivasResumen() {
    return this.service.findActivasResumen();
  }

  @Get(':id/orden-produccion')
  findOrdenProduccion(@Param('id') id: string) {
    return this.service.findOrdenProduccion(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Serie minuto a minuto de una sesión (velocidad ventana y otros)
  @Get(':id/serie-minuto')
  async serieMinuto(
    @Param('id') id: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ) {
    return this.indicadorMinutoService.seriePorSesion(id, inicio, fin);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSesionTrabajoDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/finalizar')
  finalizar(@Param('id') id: string) {
    return this.service.finalizar(id);
  }

  @Post('finalizar-todas')
  finalizarTodas() {
    return this.service.finalizarTodas();
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('maquina/:id/activa')
  async findSesionActiva(
    @Param('id') id: string,
    @Query('esp32') esp32?: string,
  ) {
    const sesion = await this.service.findByMaquina(id);
    if (esp32 === 'true') return sesion.id;
    return sesion;
  }

}
