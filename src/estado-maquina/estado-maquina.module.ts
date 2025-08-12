import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoMaquina } from './estado-maquina.entity';
import { EstadoMaquinaService } from './estado-maquina.service';
import { EstadoMaquinaController } from './estado-maquina.controller';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoSesionModule } from '../estado-sesion/estado-sesion.module';
import { PausaPasoSesionModule } from '../pausa-paso-sesion/pausa-paso-sesion.module';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { PasoProduccionModule } from '../paso-produccion/paso-produccion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstadoMaquina,
      SesionTrabajo,
      EstadoTrabajador,
      SesionTrabajoPaso,
    ]),
    PasoProduccionModule,
    EstadoSesionModule,
    PausaPasoSesionModule,
  ],
  controllers: [EstadoMaquinaController],
  providers: [EstadoMaquinaService],
  exports: [EstadoMaquinaService],
})
export class EstadoMaquinaModule {}
