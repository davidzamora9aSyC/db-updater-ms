import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { AuthModule } from './auth/auth.module';
import * as fs from 'fs';
import * as path from 'path';


@Module({
  imports: [

  TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'distrecoldb.cfqes4cyag2k.us-east-2.rds.amazonaws.com',
    port: 5432,
    username: 'postgres',
    password: 'Distrecol2025',
    database: 'distrecoldb',
    autoLoadEntities: true,
    synchronize: true,
    ssl: {
      ca: fs.readFileSync(path.join(__dirname, 'certs/global-bundle.pem')).toString(),
    },
  }),

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

  ProductividadModule,

  AuthModule],
})
export class AppModule {}
