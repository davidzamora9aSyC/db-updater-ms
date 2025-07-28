import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TrabajadorModule } from './trabajador/trabajador.module';
import { MaquinaModule } from './maquina/maquina.module';
import { OrdenProduccionModule } from './orden-produccion/orden-produccion.module';
import { PasoProduccionModule } from './paso-produccion/paso-produccion.module';
import { IndicadorModule } from './indicador/indicador.module';
import { MinutaModule } from './minuta/minuta.module';
import { RegistroMinutoModule } from './registro-minuto/registro-minuto.module';
import { AuthModule } from './auth/auth.module';
import { SesionTrabajoModule } from './sesion-trabajo/sesion-trabajo.module';
import { EstadoSesionModule } from './estado-sesion/estado-sesion.module';
import { SesionTrabajoPasoModule } from './sesion-trabajo-paso/sesion-trabajo-paso.module';
import { EmpresaModule } from './empresa/empresa.module';
import { MaterialOrdenModule } from './material-orden/material-orden.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { TimezoneModule } from './common/timezone.module';
import { TimezoneInterceptor } from './common/timezone.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';

@Module({
  imports: [
    ScheduleModule.forRoot(),

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
        ca: fs
          .readFileSync(
            path.join(__dirname, '..', 'certs', 'global-bundle.pem'),
          )
          .toString(),
      },
    }),

    TrabajadorModule,

    MaquinaModule,

    OrdenProduccionModule,

    PasoProduccionModule,

    IndicadorModule,

    MinutaModule,

    RegistroMinutoModule,
    ConfiguracionModule,
    TimezoneModule,

    SesionTrabajoModule,
    SesionTrabajoPasoModule,

    EstadoSesionModule,

    EmpresaModule,

    MaterialOrdenModule,

    AuthModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: TimezoneInterceptor }],
})
export class AppModule {}
