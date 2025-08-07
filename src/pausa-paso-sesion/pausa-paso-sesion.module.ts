import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PausaPasoSesion } from './pausa-paso-sesion.entity';
import { PausaPasoSesionService } from './pausa-paso-sesion.service';

@Module({
  imports: [TypeOrmModule.forFeature([PausaPasoSesion])],
  providers: [PausaPasoSesionService],
  exports: [PausaPasoSesionService],
})
export class PausaPasoSesionModule {}
