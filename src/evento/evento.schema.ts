import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type EventoTipo = 'PEDAL' | 'TOLVA' | 'INICIO_RECURSO' | 'INICIO_ORDEN'

@Schema({ timestamps: true })
export class Evento extends Document {
  @Prop({ required: true })
  recursoId: string

  @Prop({ required: true, enum: ['PEDAL', 'TOLVA', 'INICIO_RECURSO', 'INICIO_ORDEN'] })
  tipo: EventoTipo

  @Prop()
  ordenId?: string

  @Prop()
  pasoId?: string
}

export const EventoSchema = SchemaFactory.createForClass(Evento)