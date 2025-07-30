import {
  IsString,
  IsInt,
  IsDate,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PasoOrdenDto } from './paso-orden.dto'
import { EstadoOrdenProduccion } from '../entity'

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

  @IsEnum(EstadoOrdenProduccion)
  estado: EstadoOrdenProduccion

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PasoOrdenDto)
  pasos: PasoOrdenDto[]
}