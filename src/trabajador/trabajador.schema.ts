import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Trabajador extends Document {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true, unique: true })
  identificacion: string;

  @Prop({ default: true })
  estado: boolean;
}

export const TrabajadorSchema = SchemaFactory.createForClass(Trabajador);