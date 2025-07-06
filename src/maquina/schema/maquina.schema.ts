import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Maquina {
  @Prop({ required: true })
  nombre: string;

  @Prop({ default: 'activa' })
  estado: string;
}

export type MaquinaDocument = Maquina & Document;
export const MaquinaSchema = SchemaFactory.createForClass(Maquina);