import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { AreaService } from './area.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Controller('areas')
export class AreaController {
  constructor(private readonly service: AreaService) {}

  @Post()
  crearArea(@Body() dto: CreateAreaDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  obtenerArea(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  listarAreas() {
    return this.service.findAll();
  }

  @Put(':id')
  actualizarArea(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  eliminarArea(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
