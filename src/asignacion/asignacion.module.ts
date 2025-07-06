import { Module } from '@nestjs/common';
import { AsignacionController } from './asignacion.controller';
import { AsignacionService } from './asignacion.service';

@Module({
  controllers: [AsignacionController],
  providers: [AsignacionService]
})
export class AsignacionModule {}
