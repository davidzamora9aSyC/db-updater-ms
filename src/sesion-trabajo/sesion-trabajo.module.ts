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

@Module({
  imports: [
    TypeOrmModule.forFeature([EstadoSesion, EstadoTrabajador, EstadoMaquina, SesionTrabajo, RegistroMinuto]),
    RegistroMinutoModule,
    EstadoSesionModule,
  ],
  providers: [SesionTrabajoService],
  controllers: [SesionTrabajoController],
})
export class SesionTrabajoModule {}
