import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EstadoTrabajadorService } from './estado-trabajador.service';
import { CreateEstadoTrabajadorDto } from './dto/create-estado-trabajador.dto';
import { UpdateEstadoTrabajadorDto } from './dto/update-estado-trabajador.dto';

@ApiTags('EstadosTrabajador')
@Controller('estados-trabajador')
export class EstadoTrabajadorController {
  constructor(private readonly service: EstadoTrabajadorService) {}

  @Post()
  create(@Body() dto: CreateEstadoTrabajadorDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('trabajador/:id')
  findByTrabajador(
    @Param('id') id: string,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
  ) {
    if (!inicio || !fin) {
      throw new BadRequestException('inicio y fin son requeridos');
    }
    return this.service.findByTrabajador(id, inicio, fin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEstadoTrabajadorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('trabajador/:id/finalizar-descanso')
  finalizarDescanso(@Param('id') id: string) {
    return this.service.finalizarDescanso(id);
  }
}
