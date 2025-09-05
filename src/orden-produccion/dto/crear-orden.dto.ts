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
import { ApiProperty } from '@nestjs/swagger'


export class CrearOrdenDto {
  @ApiProperty({ description: 'Número de la orden', example: 'OP-2025-0001' })
  @IsString()
  numero: string

  @ApiProperty({ description: 'Producto a fabricar', example: 'Banda transportadora' })
  @IsString()
  producto: string

  @ApiProperty({ description: 'Cantidad a producir', example: 1000 })
  @IsInt()
  cantidadAProducir: number

  @ApiProperty({ description: 'Fecha de la orden', type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  fechaOrden: Date

  @ApiProperty({ description: 'Fecha de vencimiento', type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  fechaVencimiento: Date

  

  @ApiProperty({ description: 'Pasos de la orden', type: () => [PasoOrdenDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PasoOrdenDto)
  pasos: PasoOrdenDto[]
  
}
