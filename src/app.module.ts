import { Module } from '@nestjs/common';
import { TrabajadorModule } from './trabajador/trabajador.module';
import { MaquinaModule } from './maquina/maquina.module';
import { OrdenProduccionModule } from './orden-produccion/orden-produccion.module';
import { PasoProduccionModule } from './paso-produccion/paso-produccion.module';
import { RecursoModule } from './recurso/recurso.module';
import { AsignacionModule } from './asignacion/asignacion.module';
import { EventoModule } from './evento/evento.module';
import { BotonModule } from './boton/boton.module';
import { IndicadorModule } from './indicador/indicador.module';
import { MinutaModule } from './minuta/minuta.module';
import { RegistroMinutoModule } from './registro-minuto/registro-minuto.module';
import { ProductividadModule } from './productividad/productividad.module';


@Module({
  imports: [

  TrabajadorModule,

  MaquinaModule,

  OrdenProduccionModule,

  PasoProduccionModule,

  RecursoModule,

  AsignacionModule,

  EventoModule,

  BotonModule,

  IndicadorModule,

  MinutaModule,

  RegistroMinutoModule,

  ProductividadModule],
})
export class AppModule {}
