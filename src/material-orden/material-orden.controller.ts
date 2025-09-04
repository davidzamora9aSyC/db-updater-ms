import { Controller, Post, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MaterialOrdenService } from './material-orden.service';
import { CreateMaterialOrdenDto } from './dto/create-material-orden.dto';
import { UpdateMaterialOrdenDto } from './dto/update-material-orden.dto';

@ApiTags('MaterialOrden')
@Controller('materiales-orden')
export class MaterialOrdenController {
  constructor(private readonly service: MaterialOrdenService) {}

  @Post()
  create(@Body() dto: CreateMaterialOrdenDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaterialOrdenDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
