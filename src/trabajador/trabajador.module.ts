import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TrabajadorController } from './trabajador.controller'
import { TrabajadorService } from './trabajador.service'
import { Trabajador } from './trabajador.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Trabajador])],
  controllers: [TrabajadorController],
  providers: [TrabajadorService],
})
export class TrabajadorModule {}
