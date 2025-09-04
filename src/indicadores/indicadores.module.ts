import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndicadoresController } from './indicadores.controller';
import { IndicadoresService } from './indicadores.service';
import { IndicadorDiarioDim } from '../indicador-diario-dim/indicador-diario-dim.entity';
import { Area } from '../area/area.entity';
import { SesionTrabajoModule } from '../sesion-trabajo/sesion-trabajo.module';

@Module({
  imports: [TypeOrmModule.forFeature([IndicadorDiarioDim, Area]), SesionTrabajoModule],
  controllers: [IndicadoresController],
  providers: [IndicadoresService],
})
export class IndicadoresModule {}
