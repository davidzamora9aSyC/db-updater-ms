import { IsString, IsNotEmpty, IsNumber, IsIn, IsUUID } from 'class-validator'

export class CreatePasoProduccionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsUUID()
  orden: string

  @IsString()
  codigoInterno: string

  @IsNumber()
  cantidadRequerida: number

  @IsNumber()
  cantidadProducida: number

  @IsString()
  @IsIn(['pendiente', 'en_progreso', 'completado'])
  estado: string
}