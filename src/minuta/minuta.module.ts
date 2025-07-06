import { TypeOrmModule } from '@nestjs/typeorm';
import { Minuta } from './minuta.entity';
import { Module } from '@nestjs/common';
import { MinutaController } from './minuta.controller';
import { MinutaService } from './minuta.service';

@Module({
  imports: [TypeOrmModule.forFeature([Minuta])],
  controllers: [MinutaController],
  providers: [MinutaService]
})
export class MinutaModule {}
