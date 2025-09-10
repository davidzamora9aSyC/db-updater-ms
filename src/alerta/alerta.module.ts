import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alerta } from './alerta.entity';
import { AlertaTipo } from './alerta-tipo.entity';
import { AlertaService } from './alerta.service';
import { AlertaController } from './alerta.controller';
import { AlertaConfigController } from './alerta-config.controller';
import { PausaPasoSesion } from '../pausa-paso-sesion/pausa-paso-sesion.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { Trabajador } from '../trabajador/trabajador.entity';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { RegistroMinuto } from '../registro-minuto/registro-minuto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Alerta,
      AlertaTipo,
      PausaPasoSesion,
      SesionTrabajoPaso,
      SesionTrabajo,
      Trabajador,
      RegistroMinuto,
    ]),
    ConfiguracionModule,
  ],
  controllers: [AlertaController, AlertaConfigController],
  providers: [AlertaService],
  exports: [AlertaService],
})
export class AlertaModule {}
