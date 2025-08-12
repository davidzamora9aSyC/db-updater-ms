import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoTrabajador } from './estado-trabajador.entity';
import { EstadoTrabajadorService } from './estado-trabajador.service';
import { EstadoTrabajadorController } from './estado-trabajador.controller';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';
import { EstadoSesionModule } from '../estado-sesion/estado-sesion.module';
import { PausaPasoSesionModule } from '../pausa-paso-sesion/pausa-paso-sesion.module';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { PasoProduccionModule } from '../paso-produccion/paso-produccion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstadoTrabajador,
      SesionTrabajo,
      EstadoMaquina,
      SesionTrabajoPaso,
    ]),
    PasoProduccionModule,
    EstadoSesionModule,
    PausaPasoSesionModule,
  ],
  controllers: [EstadoTrabajadorController],
  providers: [EstadoTrabajadorService],
  exports: [EstadoTrabajadorService],
})
export class EstadoTrabajadorModule {}
