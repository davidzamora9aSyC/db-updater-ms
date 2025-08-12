import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProduccionDiaria } from './produccion-diaria.entity';
import { ProduccionDiariaService } from './produccion-diaria.service';
import { ProduccionDiariaController } from './produccion-diaria.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProduccionDiaria])],
  controllers: [ProduccionDiariaController],
  providers: [ProduccionDiariaService],
  exports: [ProduccionDiariaService],
})
export class ProduccionDiariaModule {}
