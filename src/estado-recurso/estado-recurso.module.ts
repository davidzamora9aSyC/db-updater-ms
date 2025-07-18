import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoRecurso } from './estado-recurso.entity';
import { EstadoRecursoService } from './estado-recurso.service';
import { EstadoRecursoController } from './estado-recurso.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoRecurso])],
  providers: [EstadoRecursoService],
  controllers: [EstadoRecursoController],
})
export class EstadoRecursoModule {}
