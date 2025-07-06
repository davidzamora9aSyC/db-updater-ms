import { TypeOrmModule } from '@nestjs/typeorm';
import { Indicador } from './indicador.entity';
import { Module } from '@nestjs/common';
import { IndicadorController } from './indicador.controller';
import { IndicadorService } from './indicador.service';

@Module({
  imports: [TypeOrmModule.forFeature([Indicador])],
  controllers: [IndicadorController],
  providers: [IndicadorService]
})
export class IndicadorModule {}
