import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PausaPasoSesion } from './pausa-paso-sesion.entity';
import { PausaPasoSesionService } from './pausa-paso-sesion.service';
import { PasoProduccionModule } from '../paso-produccion/paso-produccion.module';

@Module({
  imports: [TypeOrmModule.forFeature([PausaPasoSesion]), PasoProduccionModule],
  providers: [PausaPasoSesionService],
  exports: [PausaPasoSesionService],
})
export class PausaPasoSesionModule {}
