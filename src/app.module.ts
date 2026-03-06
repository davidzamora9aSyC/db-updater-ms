import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TrabajadorModule } from './trabajador/trabajador.module';
import { MaquinaModule } from './maquina/maquina.module';
import { OrdenProduccionModule } from './orden-produccion/orden-produccion.module';
import { PasoProduccionModule } from './paso-produccion/paso-produccion.module';
import { MinutaModule } from './minuta/minuta.module';
import { RegistroMinutoModule } from './registro-minuto/registro-minuto.module';
import { AuthModule } from './auth/auth.module';
import { SesionTrabajoModule } from './sesion-trabajo/sesion-trabajo.module';
import { EstadoSesionModule } from './estado-sesion/estado-sesion.module';
import { EstadoTrabajadorModule } from './estado-trabajador/estado-trabajador.module';
import { EstadoMaquinaModule } from './estado-maquina/estado-maquina.module';
import { SesionTrabajoPasoModule } from './sesion-trabajo-paso/sesion-trabajo-paso.module';
import { PausaPasoSesionModule } from './pausa-paso-sesion/pausa-paso-sesion.module';
import { EmpresaModule } from './empresa/empresa.module';
import { MaterialOrdenModule } from './material-orden/material-orden.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { TimezoneModule } from './common/timezone.module';
import { TimezoneInterceptor } from './common/timezone.interceptor';
import { AreaModule } from './area/area.module';
import { ProduccionDiariaModule } from './produccion-diaria/produccion-diaria.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { IndicadorSesionMinutoModule } from './indicador-sesion-minuto/indicador-sesion-minuto.module';
import { IndicadoresModule } from './indicadores/indicadores.module';
import { AlertaModule } from './alerta/alerta.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot((() => {
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = Number(process.env.DB_PORT || 5432);
      const dbUser = process.env.DB_USERNAME || 'postgres';
      const dbPass = process.env.DB_PASSWORD || 'postgres';
      const dbName = process.env.DB_DATABASE || 'distrecoldb';
      const dbSync = (process.env.DB_SYNCHRONIZE || 'true') === 'true';
      const useSsl = (process.env.DB_SSL || 'false') === 'true';

      const caPath = process.env.DB_SSL_CA_PATH
        || path.join(__dirname, '..', 'certs', 'global-bundle.pem');

      const ssl = useSsl && fs.existsSync(caPath)
        ? { ca: fs.readFileSync(caPath).toString() }
        : (useSsl ? { rejectUnauthorized: false } : false);

      return {
        type: 'postgres' as const,
        host: dbHost,
        port: dbPort,
        username: dbUser,
        password: dbPass,
        database: dbName,
        autoLoadEntities: true,
        synchronize: dbSync,
        ssl,
      };
    })()),

    TrabajadorModule,

    MaquinaModule,

    OrdenProduccionModule,

    PasoProduccionModule,


    MinutaModule,

    RegistroMinutoModule,
    ConfiguracionModule,
    TimezoneModule,

    SesionTrabajoModule,
    SesionTrabajoPasoModule,
    PausaPasoSesionModule,

    EstadoSesionModule,
    EstadoTrabajadorModule,
    EstadoMaquinaModule,

    EmpresaModule,

    MaterialOrdenModule,

    AreaModule,
    ProduccionDiariaModule,

    AuthModule,
    IndicadorSesionMinutoModule,
    IndicadoresModule,
    AlertaModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: TimezoneInterceptor }],
})
export class AppModule {}
