import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProduccionDiaria } from './produccion-diaria.entity';
import { ProduccionDiariaService } from './produccion-diaria.service';
import { ProduccionDiariaController } from './produccion-diaria.controller';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { RegistroMinuto } from '../registro-minuto/registro-minuto.entity';
import { Area } from '../area/area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProduccionDiaria, SesionTrabajo, RegistroMinuto, Area]),
  ],
  controllers: [ProduccionDiariaController],
  providers: [ProduccionDiariaService],
  exports: [ProduccionDiariaService],
})
export class ProduccionDiariaModule {}
