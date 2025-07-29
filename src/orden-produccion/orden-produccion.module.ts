import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenProduccion } from './entity';
import { Module } from '@nestjs/common';
import { OrdenProduccionController } from './orden-produccion.controller';
import { OrdenProduccionService } from './orden-produccion.service';
import { PasoProduccion } from '../paso-produccion/paso-produccion.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { Maquina } from '../maquina/maquina.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenProduccion,
      PasoProduccion,
      SesionTrabajo,
      SesionTrabajoPaso,
      Maquina,
    ]),
  ],
  controllers: [OrdenProduccionController],
  providers: [OrdenProduccionService]
})
export class OrdenProduccionModule {}
