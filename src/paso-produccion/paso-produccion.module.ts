import { TypeOrmModule } from '@nestjs/typeorm';
import { PasoProduccion } from './paso-produccion.entity';
import { Module } from '@nestjs/common';
import { PasoProduccionController } from './paso-produccion.controller';
import { PasoProduccionService } from './paso-produccion.service';

@Module({
  imports: [TypeOrmModule.forFeature([PasoProduccion])],
  controllers: [PasoProduccionController],
  providers: [PasoProduccionService],
  exports: [PasoProduccionService ],
})
export class PasoProduccionModule {}
