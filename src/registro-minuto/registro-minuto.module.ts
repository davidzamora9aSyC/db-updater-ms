import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroMinutoService } from './registro-minuto.service';
import { RegistroMinuto } from './registro-minuto.entity';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';
import { RegistroMinutoController } from './registro-minuto.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroMinuto, SesionTrabajoPaso])],
  providers: [RegistroMinutoService],
  controllers: [RegistroMinutoController],
  exports: [RegistroMinutoService],
})
export class RegistroMinutoModule {}
