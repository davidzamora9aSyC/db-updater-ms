import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type PasoProduccionDocument = PasoProduccion & Document

@Schema({ timestamps: true })
export class PasoProduccion {
  @Prop({ required: true })
  nombre: string

  @Prop({ required: true })
  ordenProduccionId: string

  @Prop({ required: true })
  numeroPaso: number

  @Prop({ required: true, enum: ['pendiente', 'en_progreso', 'completado'], default: 'pendiente' })
  estado: string
}

export const PasoProduccionSchema = SchemaFactory.createForClass(PasoProduccion)