import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroMinutoService } from './registro-minuto.service';
import { RegistroMinuto } from './registro-minuto.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { PasoProduccion } from '../paso-produccion/paso-produccion.entity';
import { RegistroMinutoController } from './registro-minuto.controller';
import { ProduccionDiariaModule } from '../produccion-diaria/produccion-diaria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistroMinuto,
      SesionTrabajoPaso,
      SesionTrabajo,
      PasoProduccion,
    ]),
    ProduccionDiariaModule,
  ],
  providers: [RegistroMinutoService],
  controllers: [RegistroMinutoController],
  exports: [RegistroMinutoService],
})
export class RegistroMinutoModule {}
