import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndicadoresController } from './indicadores.controller';
import { IndicadoresService } from './indicadores.service';
import { IndicadorDiarioDim } from '../indicador-diario-dim/indicador-diario-dim.entity';
import { Area } from '../area/area.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IndicadorDiarioDim, Area])],
  controllers: [IndicadoresController],
  providers: [IndicadoresService],
})
export class IndicadoresModule {}

