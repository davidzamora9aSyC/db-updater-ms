import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TrabajadorController } from './trabajador.controller'
import { TrabajadorService } from './trabajador.service'
import { Trabajador } from './trabajador.entity'
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity'
import { EstadoSesion } from '../estado-sesion/estado-sesion.entity'
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trabajador,
      SesionTrabajo,
      EstadoSesion,
      EstadoTrabajador,
    ]),
  ],
  controllers: [TrabajadorController],
  providers: [TrabajadorService],
})
export class TrabajadorModule {}
