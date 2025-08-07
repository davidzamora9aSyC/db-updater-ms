import { IsUUID, IsIn, IsDateString } from 'class-validator'

export class AcumuladorDto {
  @IsUUID()
  maquina: string

  @IsUUID()
  pasoSesionTrabajo: string

  @IsIn(['pedal', 'pieza'])
  tipo: 'pedal' | 'pieza'

  @IsDateString()
  minutoInicio: string
}