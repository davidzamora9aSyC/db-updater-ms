import { IsUUID, IsIn, IsDateString, IsOptional } from 'class-validator'

export class AcumuladorDto {
  @IsUUID()
  maquina: string

  @IsUUID()
  paso: string

  @IsIn(['pedal', 'pieza'])
  tipo: 'pedal' | 'pieza'

  @IsOptional()
  @IsDateString()
  minutoInicio: string
}