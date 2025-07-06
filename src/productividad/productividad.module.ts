import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductividadService } from './productividad.service'
import { ProductividadController } from './productividad.controller'
import { Productividad } from './productividad.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Productividad])],
  controllers: [ProductividadController],
  providers: [ProductividadService],
})
export class ProductividadModule {}