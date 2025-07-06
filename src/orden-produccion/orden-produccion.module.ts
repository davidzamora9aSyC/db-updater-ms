import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenProduccion } from './entity';
import { Module } from '@nestjs/common';
import { OrdenProduccionController } from './orden-produccion.controller';
import { OrdenProduccionService } from './orden-produccion.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrdenProduccion])],
  controllers: [OrdenProduccionController],
  providers: [OrdenProduccionService]
})
export class OrdenProduccionModule {}
