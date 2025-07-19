import { IsString, IsInt, IsDate } from 'class-validator'
import { Type } from 'class-transformer'

export class CrearOrdenDto {
  @IsString()
  numero: string

  @IsString()
  producto: string

  @IsInt()
  cantidadAProducir: number

  @Type(() => Date)
  @IsDate()
  fechaOrden: Date

  @Type(() => Date)
  @IsDate()
  fechaVencimiento: Date

  @IsString()
  estado: string
}