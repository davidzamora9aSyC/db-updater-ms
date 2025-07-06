import { Module } from '@nestjs/common';
import { TrabajadorController } from './trabajador.controller';
import { TrabajadorService } from './trabajador.service';

@Module({
  controllers: [TrabajadorController],
  providers: [TrabajadorService]
})
export class TrabajadorModule {}
