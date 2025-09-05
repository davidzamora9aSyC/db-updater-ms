import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateMinutaDto {
  @ApiProperty({ description: 'ID del recurso (trabajador/máquina)', example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  recursoId: string

  @ApiProperty({ description: 'ID de la orden de producción', example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  ordenId: string

  @ApiProperty({ description: 'ID del paso/proceso', example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  pasoId: string

  @ApiProperty({ description: 'Cantidad producida', example: 120 })
  @IsNotEmpty()
  @IsNumber()
  cantidad: number

  @ApiProperty({ description: 'Cantidad de pedalazos', example: 240 })
  @IsNotEmpty()
  @IsNumber()
  pedalazos: number

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string
}
