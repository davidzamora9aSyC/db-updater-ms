import { Module } from '@nestjs/common';
import { BotonController } from './boton.controller';
import { BotonService } from './boton.service';

@Module({
  controllers: [BotonController],
  providers: [BotonService]
})
export class BotonModule {}
