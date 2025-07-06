import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Indicador extends Document {
  @Prop({ required: true })
  recursoId: string;

  @Prop({ required: true })
  piezas: number;

  @Prop({ required: true })
  pedalazos: number;

  @Prop({ required: true })
  timestamp: Date;
}

export const IndicadorSchema = SchemaFactory.createForClass(Indicador);