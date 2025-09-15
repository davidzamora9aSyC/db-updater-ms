import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionTrabajo } from './sesion-trabajo.entity';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { SesionTrabajoController } from './sesion-trabajo.controller';
import { RegistroMinutoModule } from '../registro-minuto/registro-minuto.module';
import { EstadoSesionModule } from '../estado-sesion/estado-sesion.module';
import { EstadoSesion } from '../estado-sesion/estado-sesion.entity';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';
import { RegistroMinuto } from '../registro-minuto/registro-minuto.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { IndicadorSesionMinuto } from '../indicador-sesion-minuto/indicador-sesion-minuto.entity';
import { PausaPasoSesion } from '../pausa-paso-sesion/pausa-paso-sesion.entity';
import { IndicadorSesion } from '../indicador-sesion/indicador-sesion.entity';
import { IndicadorDiarioDim } from '../indicador-diario-dim/indicador-diario-dim.entity';
import { Maquina } from '../maquina/maquina.entity';
import { IndicadorDiarioDimModule } from '../indicador-diario-dim/indicador-diario-dim.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstadoSesion,
      EstadoTrabajador,
      EstadoMaquina,
      SesionTrabajo,
      RegistroMinuto,
      SesionTrabajoPaso,
      IndicadorSesionMinuto,
      PausaPasoSesion,
      IndicadorSesion,
      IndicadorDiarioDim,
      Maquina,

    ]),
    RegistroMinutoModule,
    EstadoSesionModule,
    IndicadorDiarioDimModule,
  ],
  providers: [SesionTrabajoService],
  controllers: [SesionTrabajoController],
  exports: [SesionTrabajoService],
})
export class SesionTrabajoModule {}
