import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as nodeCrypto from 'crypto';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

(global as any).crypto = (global as any).crypto || nodeCrypto;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['https://production-control.vercel.app', 'http://localhost:3000', 'http://186.29.33.99'],
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
  await app.listen(3000, '127.0.0.1');
}
bootstrap();
