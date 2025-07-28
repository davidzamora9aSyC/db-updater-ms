import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionTrabajo } from './sesion-trabajo.entity';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { SesionTrabajoController } from './sesion-trabajo.controller';
import { RegistroMinutoModule } from '../registro-minuto/registro-minuto.module';
import { EstadoSesionModule } from '../estado-sesion/estado-sesion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SesionTrabajo]),
    RegistroMinutoModule,
    EstadoSesionModule,
  ],
  providers: [SesionTrabajoService],
  controllers: [SesionTrabajoController],
})
export class SesionTrabajoModule {}
