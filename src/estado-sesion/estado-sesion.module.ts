import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoSesion } from './estado-sesion.entity';
import { EstadoSesionService } from './estado-sesion.service';
import { EstadoSesionController } from './estado-sesion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoSesion])],
  providers: [EstadoSesionService],
  controllers: [EstadoSesionController],
  exports: [EstadoSesionService],
})
export class EstadoSesionModule {}
