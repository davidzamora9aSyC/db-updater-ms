import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndicadorDiarioDim } from './indicador-diario-dim.entity';
import { IndicadorDiarioSyncService } from './indicador-diario-sync.service';
import { IndicadorSesion } from '../indicador-sesion/indicador-sesion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IndicadorDiarioDim, IndicadorSesion])],
  providers: [IndicadorDiarioSyncService],
  exports: [IndicadorDiarioSyncService],
})
export class IndicadorDiarioDimModule {}
