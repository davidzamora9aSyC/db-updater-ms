import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoTrabajador } from './estado-trabajador.entity';
import { EstadoTrabajadorService } from './estado-trabajador.service';
import { EstadoTrabajadorController } from './estado-trabajador.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoTrabajador])],
  controllers: [EstadoTrabajadorController],
  providers: [EstadoTrabajadorService],
  exports: [EstadoTrabajadorService],
})
export class EstadoTrabajadorModule {}
