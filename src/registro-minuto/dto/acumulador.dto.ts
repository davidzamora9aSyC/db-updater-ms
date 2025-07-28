import { IsUUID, IsIn, IsDateString } from 'class-validator'

export class AcumuladorDto {
  @IsUUID()
  sesionTrabajo: string

  @IsIn(['pedal', 'pieza'])
  tipo: 'pedal' | 'pieza'

  @IsDateString()
  minutoInicio: string
}