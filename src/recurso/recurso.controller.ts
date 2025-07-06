import { Controller, Get, Param, Patch } from '@nestjs/common';
import { RecursoService } from './recurso.service';

@Controller('recursos')
export class RecursoController {
  constructor(private readonly recursoService: RecursoService) {}

  @Get()
  findAll() {
    return this.recursoService.findAll();
  }

  @Get('actuales')
  findActuales() {
    return this.recursoService.findActuales();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recursoService.findOne(id);
  }

  @Patch(':id/estado')
  toggleEstado(@Param('id') id: string) {
    return this.recursoService.toggleEstado(id);
  }
}