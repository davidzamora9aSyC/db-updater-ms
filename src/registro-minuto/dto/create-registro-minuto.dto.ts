import { IsNotEmpty, IsString, IsNumber, IsDate, IsUUID } from 'class-validator'

export class CreateRegistroMinutoDto {
  @IsUUID()
  sesionTrabajo: string

  @IsDate()
  minutoInicio: Date

  @IsNumber()
  pedaleadas: number

  @IsNumber()
  piezasContadas: number
}