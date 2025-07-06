import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaquinaController } from './maquina.controller';
import { MaquinaService } from './maquina.service';
import { Maquina, MaquinaSchema } from './schema/maquina.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Maquina.name, schema: MaquinaSchema }])],
  controllers: [MaquinaController],
  providers: [MaquinaService],
  exports: [MaquinaService],
})
export class MaquinaModule {}