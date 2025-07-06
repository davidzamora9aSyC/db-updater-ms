import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ timestamps: true })
export class OrdenProduccion {
  @Prop({ required: true })
  codigo: string

  @Prop({ type: [{ type: Types.ObjectId, ref: 'PasoProduccion' }] })
  pasos: Types.ObjectId[]

  @Prop({ default: 0 })
  progreso: number
}

export type OrdenProduccionDocument = OrdenProduccion & Document
export const OrdenProduccionSchema = SchemaFactory.createForClass(OrdenProduccion)