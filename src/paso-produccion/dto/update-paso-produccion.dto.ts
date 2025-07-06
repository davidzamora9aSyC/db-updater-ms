import { IsOptional, IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator'

export class UpdatePasoProduccionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ordenProduccionId?: string

  @IsOptional()
  @IsNumber()
  numeroPaso?: number

  @IsOptional()
  @IsString()
  @IsIn(['pendiente', 'en_progreso', 'completado'])
  estado?: string
}