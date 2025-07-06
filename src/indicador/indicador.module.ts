import { Module } from '@nestjs/common';
import { IndicadorController } from './indicador.controller';
import { IndicadorService } from './indicador.service';

@Module({
  controllers: [IndicadorController],
  providers: [IndicadorService]
})
export class IndicadorModule {}
