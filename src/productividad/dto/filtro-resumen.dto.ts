import { IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class FiltroResumenDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number
}