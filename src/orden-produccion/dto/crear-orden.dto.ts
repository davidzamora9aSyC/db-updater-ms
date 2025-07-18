import { IsString, IsInt, IsDate } from 'class-validator'

export class CrearOrdenDto {
  @IsString()
  numero: string

  @IsString()
  producto: string

  @IsInt()
  cantidadAProducir: number

  @IsDate()
  fechaOrden: Date

  @IsDate()
  fechaVencimiento: Date

  @IsString()
  estado: string
}