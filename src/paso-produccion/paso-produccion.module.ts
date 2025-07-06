import { Module } from '@nestjs/common';
import { PasoProduccionController } from './paso-produccion.controller';
import { PasoProduccionService } from './paso-produccion.service';

@Module({
  controllers: [PasoProduccionController],
  providers: [PasoProduccionService]
})
export class PasoProduccionModule {}
