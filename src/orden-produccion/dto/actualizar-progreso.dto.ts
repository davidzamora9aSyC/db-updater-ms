import { IsNumber, Min, Max } from 'class-validator'

export class ActualizarProgresoDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  progreso: number
}