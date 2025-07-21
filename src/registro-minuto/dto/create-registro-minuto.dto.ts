import { IsUUID, IsDateString, IsNumber } from 'class-validator'

export class CreateRegistroMinutoDto {
  @IsUUID()
  sesionTrabajo: string

  @IsDateString()
  minutoInicio: string

  @IsNumber()
  pedaleadas: number

  @IsNumber()
  piezasContadas: number
}