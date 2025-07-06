import { TypeOrmModule } from '@nestjs/typeorm';
import { Asignacion } from './asignacion.entity';
import { Module } from '@nestjs/common';
import { AsignacionController } from './asignacion.controller';
import { AsignacionService } from './asignacion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asignacion])],
  controllers: [AsignacionController],
  providers: [AsignacionService]
})
export class AsignacionModule {}
