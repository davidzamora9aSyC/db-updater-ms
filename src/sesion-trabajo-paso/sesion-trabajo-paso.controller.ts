import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common';
import { SesionTrabajoPasoService } from './sesion-trabajo-paso.service';
import { CreateSesionTrabajoPasoDto } from './dto/create-sesion-trabajo-paso.dto';
import { UpdateSesionTrabajoPasoDto } from './dto/update-sesion-trabajo-paso.dto';

@Controller('sesion-trabajo-pasos')
export class SesionTrabajoPasoController {
  constructor(private readonly service: SesionTrabajoPasoService) { }

  @Post()
  create(@Body() dto: CreateSesionTrabajoPasoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('por-paso/:pasoId')
  findByPaso(@Param('pasoId') pasoId: string) {
    return this.service.findByPaso(pasoId);
  }

  @Get('por-sesion/:sesionId')
  findBySesion(@Param('sesionId') sesionId: string) {
    return this.service.findBySesion(sesionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSesionTrabajoPasoDto) {
    return this.service.update(id, dto);
  }

  @Put('batch')
  updateBatch(@Body() updates: { id: string; data: UpdateSesionTrabajoPasoDto }[]) {
    return Promise.all(updates.map(({ id, data }) => this.service.update(id, data)));
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete('por-sesion/:sesionId')
  removeBySesion(@Param('sesionId') sesionId: string) {
    return this.service.removeBySesion(sesionId);
  }

  @Delete('por-paso/:pasoId')
  removeByPaso(@Param('pasoId') pasoId: string) {
    return this.service.removeByPaso(pasoId);
  }
}
