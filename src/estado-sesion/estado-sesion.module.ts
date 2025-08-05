import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoSesion } from './estado-sesion.entity';
import { EstadoSesionService } from './estado-sesion.service';
import { EstadoSesionController } from './estado-sesion.controller';
import { PasoProduccionModule } from '../paso-produccion/paso-produccion.module';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoSesion]), PasoProduccionModule],
  providers: [EstadoSesionService],
  controllers: [EstadoSesionController],
  exports: [EstadoSesionService],
})
export class EstadoSesionModule {}
