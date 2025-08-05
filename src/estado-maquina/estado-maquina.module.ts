import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoMaquina } from './estado-maquina.entity';
import { EstadoMaquinaService } from './estado-maquina.service';
import { EstadoMaquinaController } from './estado-maquina.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoMaquina])],
  controllers: [EstadoMaquinaController],
  providers: [EstadoMaquinaService],
  exports: [EstadoMaquinaService],
})
export class EstadoMaquinaModule {}
