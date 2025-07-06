import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AsignacionDocument = Asignacion & Document;

@Schema({ timestamps: true })
export class Asignacion {
  @Prop({ required: true })
  trabajadorId: string;

  @Prop({ required: true })
  maquinaId: string;

  @Prop({ default: true })
  activa: boolean;
}

export const AsignacionSchema = SchemaFactory.createForClass(Asignacion);