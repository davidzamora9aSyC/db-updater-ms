import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionTrabajoPaso } from './sesion-trabajo-paso.entity';
import { SesionTrabajoPasoService } from './sesion-trabajo-paso.service';
import { SesionTrabajoPasoController } from './sesion-trabajo-paso.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SesionTrabajoPaso])],
  providers: [SesionTrabajoPasoService],
  controllers: [SesionTrabajoPasoController],
  exports: [SesionTrabajoPasoService],
})
export class SesionTrabajoPasoModule {}
