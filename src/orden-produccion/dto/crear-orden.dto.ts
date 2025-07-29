import {
  IsString,
  IsInt,
  IsDate,
  IsUUID,
  ValidateNested,
  IsArray,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PasoOrdenDto } from './paso-orden.dto'

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

  @IsUUID()
  maquina: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PasoOrdenDto)
  pasos: PasoOrdenDto[]
}