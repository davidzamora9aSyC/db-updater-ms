import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaquinaController } from './maquina.controller';
import { MaquinaService } from './maquina.service';
import { Maquina } from './maquina.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Maquina])],
  controllers: [MaquinaController],
  providers: [MaquinaService],
  exports: [MaquinaService],
})
export class MaquinaModule {}