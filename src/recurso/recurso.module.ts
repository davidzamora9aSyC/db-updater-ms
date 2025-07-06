import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecursoController } from './recurso.controller';
import { RecursoService } from './recurso.service';
import { Recurso, RecursoSchema } from './recurso.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Recurso.name, schema: RecursoSchema }])],
  controllers: [RecursoController],
  providers: [RecursoService],
})
export class RecursoModule {}