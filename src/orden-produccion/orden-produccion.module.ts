import { Module } from '@nestjs/common';
import { OrdenProduccionController } from './orden-produccion.controller';
import { OrdenProduccionService } from './orden-produccion.service';

@Module({
  controllers: [OrdenProduccionController],
  providers: [OrdenProduccionService]
})
export class OrdenProduccionModule {}
