import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class Productividad extends Document {
  @Prop({ required: true }) trabajadorId: string
  @Prop({ required: true }) recursoId: string
  @Prop({ required: true }) pasoId: string
  @Prop({ required: true }) ordenId: string
  @Prop({ required: true }) cantidad: number
  @Prop({ required: true }) fecha: Date
  @Prop({ required: true }) anio: number
  @Prop({ required: true }) mes: number
}

export const ProductividadSchema = SchemaFactory.createForClass(Productividad)