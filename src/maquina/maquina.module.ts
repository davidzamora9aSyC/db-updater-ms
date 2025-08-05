import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaquinaController } from './maquina.controller';
import { MaquinaService } from './maquina.service';
import { Maquina } from './maquina.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { EstadoSesion } from '../estado-sesion/estado-sesion.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maquina, SesionTrabajo, EstadoSesion, EstadoMaquina]),
  ],
  controllers: [MaquinaController],
  providers: [MaquinaService],
  exports: [MaquinaService],
})
export class MaquinaModule {}