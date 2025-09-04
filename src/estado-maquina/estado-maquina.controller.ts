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
import { EstadoMaquinaService } from './estado-maquina.service';
import { CreateEstadoMaquinaDto } from './dto/create-estado-maquina.dto';
import { UpdateEstadoMaquinaDto } from './dto/update-estado-maquina.dto';

@ApiTags('EstadosMaquina')
@Controller('estados-maquina')
export class EstadoMaquinaController {
  constructor(private readonly service: EstadoMaquinaService) {}

  @Post()
  create(@Body() dto: CreateEstadoMaquinaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('maquina/:id')
  findByMaquina(
    @Param('id') id: string,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
  ) {
    if (!inicio || !fin) {
      throw new BadRequestException('inicio y fin son requeridos');
    }
    return this.service.findByMaquina(id, inicio, fin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEstadoMaquinaDto) {
    return this.service.update(id, dto);
  }

  @Post('maquina/:id/finalizar-mantenimiento')
  finalizarMantenimiento(@Param('id') id: string) {
    return this.service.finalizarMantenimiento(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
