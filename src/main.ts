import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedStaticOrigins = new Set([
    'https://production-control.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  const privateIpv4Origin = /^http:\/\/(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow same-machine tools and local network frontends during development.
      if (!origin || allowedStaticOrigins.has(origin) || privateIpv4Origin.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin no permitido por CORS: ${origin}`), false);
    },
    methods: 'GET,POST,PUT,PATCH,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('db-updater-ms API')
    .setDescription('API de control de producción y KPIs')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'API Docs - db-updater-ms',
    swaggerOptions: { persistAuthorization: true },
  });
  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
