import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndicadorSesionMinuto } from './indicador-sesion-minuto.entity';
import { IndicadorSesionMinutoService } from './indicador-sesion-minuto.service';
import { PausaPasoSesion } from '../pausa-paso-sesion/pausa-paso-sesion.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { SesionTrabajoModule } from '../sesion-trabajo/sesion-trabajo.module';
import { IndicadorDiarioDimModule } from '../indicador-diario-dim/indicador-diario-dim.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IndicadorSesionMinuto,
      PausaPasoSesion,
      SesionTrabajo,
    ]),
    SesionTrabajoModule,
    IndicadorDiarioDimModule,
  ],
  providers: [IndicadorSesionMinutoService],
  exports: [IndicadorSesionMinutoService],
})
export class IndicadorSesionMinutoModule {}
