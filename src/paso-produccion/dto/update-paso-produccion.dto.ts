import { IsOptional, IsString, IsNotEmpty, IsNumber, IsIn, IsUUID } from 'class-validator'

export class UpdatePasoProduccionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string

  @IsOptional()
  @IsUUID()
  orden?: string

  @IsOptional()
  @IsString()
  codigoInterno?: string

  @IsOptional()
  @IsNumber()
  cantidadRequerida?: number

  @IsOptional()
  @IsNumber()
  cantidadProducida?: number

  @IsOptional()
  @IsString()
  @IsIn(['pendiente', 'en_progreso', 'completado'])
  estado?: string
}