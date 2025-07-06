import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Recurso extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Trabajador', required: true })
  trabajador: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Maquina', required: true })
  maquina: Types.ObjectId;

  @Prop({ default: true })
  activo: boolean;
}

export const RecursoSchema = SchemaFactory.createForClass(Recurso);