import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation, getSchemaPath } from '@nestjs/swagger';
import { SesionTrabajoPasoService } from './sesion-trabajo-paso.service';
import { CreateSesionTrabajoPasoDto } from './dto/create-sesion-trabajo-paso.dto';
import { UpdateSesionTrabajoPasoDto } from './dto/update-sesion-trabajo-paso.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('SesionTrabajoPaso')
@Controller('sesion-trabajo-pasos')
export class SesionTrabajoPasoController {
  constructor(private readonly service: SesionTrabajoPasoService) { }

  @Post()
  @Public()
  create(@Body() dto: CreateSesionTrabajoPasoDto) {
    return this.service.create(dto);
  }

  @Post('batch')
  @Public()
  @ApiBody({ type: [CreateSesionTrabajoPasoDto] })
  createBatch(@Body() dtos: CreateSesionTrabajoPasoDto[]) {
    return Promise.all(dtos.map(dto => this.service.create(dto)));
  }

  @Get()
  @Public()
  findAll() {
    return this.service.findAll();
  }

  @Get('por-paso/:pasoId')
  @Public()
  findByPaso(@Param('pasoId') pasoId: string) {
    return this.service.findByPaso(pasoId);
  }

  @Get('por-sesion/:sesionId')
  @Public()
  findBySesion(@Param('sesionId') sesionId: string) {
    return this.service.findBySesion(sesionId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Public()
  update(@Param('id') id: string, @Body() dto: UpdateSesionTrabajoPasoDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/finalizar')
  @Public()
  finalizar(@Param('id') id: string) {
    return this.service.finalizar(id);
  }

  @Post('finalizar-sesiones-terminadas')
  @ApiOperation({ summary: 'Finalizar asignaciones de sesiones ya cerradas' })
  finalizarSesionesTerminadas() {
    return this.service.finalizarDeSesionesTerminadas();
  }

  @Put('batch')
  @ApiBody({ schema: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        data: { $ref: getSchemaPath(UpdateSesionTrabajoPasoDto) }
      },
      required: ['id', 'data']
    }
  } })
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
