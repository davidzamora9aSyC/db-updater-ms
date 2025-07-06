import { TypeOrmModule } from '@nestjs/typeorm';
import { Boton } from './boton.entity';
import { Module } from '@nestjs/common';
import { BotonController } from './boton.controller';
import { BotonService } from './boton.service';

@Module({
  imports: [TypeOrmModule.forFeature([Boton])],
  controllers: [BotonController],
  providers: [BotonService]
})
export class BotonModule {}
