import { Module } from '@nestjs/common';
import { MinutaController } from './minuta.controller';
import { MinutaService } from './minuta.service';

@Module({
  controllers: [MinutaController],
  providers: [MinutaService]
})
export class MinutaModule {}
