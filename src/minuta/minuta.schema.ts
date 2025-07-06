import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class Minuta extends Document {
  @Prop({ required: true })
  recursoId: string

  @Prop({ required: true })
  ordenId: string

  @Prop({ required: true })
  pasoId: string

  @Prop({ required: true })
  cantidad: number

  @Prop({ required: true })
  pedalazos: number

  @Prop()
  observaciones?: string
}

export const MinutaSchema = SchemaFactory.createForClass(Minuta)