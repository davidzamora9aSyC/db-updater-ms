import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoController } from './evento.controller';
import { EventoService } from './evento.service';
import { Evento } from './evento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evento])],
  controllers: [EventoController],
  providers: [EventoService],
})
export class EventoModule {}
