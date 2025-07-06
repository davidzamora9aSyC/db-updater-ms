import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class Boton extends Document {
  @Prop({ required: true })
  tipo: string

  @Prop({ required: true })
  recursoId: string
}

export const BotonSchema = SchemaFactory.createForClass(Boton)