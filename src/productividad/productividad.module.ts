import { Module } from '@nestjs/common'
import { ProductividadService } from './productividad.service'
import { ProductividadController } from './productividad.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { Productividad, ProductividadSchema } from './productividad.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Productividad.name, schema: ProductividadSchema }])],
  controllers: [ProductividadController],
  providers: [ProductividadService],
})
export class ProductividadModule {}