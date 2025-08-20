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
    ]),
    RegistroMinutoModule,
    EstadoSesionModule,
  ],
  providers: [SesionTrabajoService],
  controllers: [SesionTrabajoController],
  exports: [SesionTrabajoService],
})
export class SesionTrabajoModule {}
