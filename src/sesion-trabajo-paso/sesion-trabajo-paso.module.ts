import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionTrabajoPaso } from './sesion-trabajo-paso.entity';
import { SesionTrabajoPasoService } from './sesion-trabajo-paso.service';
import { SesionTrabajoPasoController } from './sesion-trabajo-paso.controller';
import { PausaPasoSesionModule } from '../pausa-paso-sesion/pausa-paso-sesion.module';

@Module({
  imports: [TypeOrmModule.forFeature([SesionTrabajoPaso]), PausaPasoSesionModule],
  providers: [SesionTrabajoPasoService],
  controllers: [SesionTrabajoPasoController],
})
export class SesionTrabajoPasoModule {}
