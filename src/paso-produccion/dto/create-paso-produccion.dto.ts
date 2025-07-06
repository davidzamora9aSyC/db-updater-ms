import { IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator'

export class CreatePasoProduccionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsString()
  @IsNotEmpty()
  ordenProduccionId: string

  @IsNumber()
  numeroPaso: number

  @IsString()
  @IsIn(['pendiente', 'en_progreso', 'completado'])
  estado: string
}