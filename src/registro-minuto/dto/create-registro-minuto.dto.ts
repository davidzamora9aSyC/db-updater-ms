import { IsNotEmpty, IsString, IsNumber, IsDate } from 'class-validator'

export class CreateRegistroMinutoDto {
  @IsNotEmpty()
  @IsString()
  recursoId: string

  @IsNotEmpty()
  @IsString()
  ordenId: string

  @IsNotEmpty()
  @IsString()
  pasoId: string

  @IsNotEmpty()
  @IsNumber()
  cantidad: number

  @IsNotEmpty()
  @IsNumber()
  pedalazos: number

  @IsNotEmpty()
  @IsDate()
  timestamp: Date
}