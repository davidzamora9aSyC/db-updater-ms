import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator'

export class CreateMinutaDto {
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

  @IsOptional()
  @IsString()
  observaciones?: string
}
