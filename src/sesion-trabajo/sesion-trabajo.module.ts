import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionTrabajo } from './sesion-trabajo.entity';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { SesionTrabajoController } from './sesion-trabajo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SesionTrabajo])],
  providers: [SesionTrabajoService],
  controllers: [SesionTrabajoController],
})
export class SesionTrabajoModule {}
