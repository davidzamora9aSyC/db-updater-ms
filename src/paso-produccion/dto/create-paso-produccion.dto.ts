import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional, IsEnum } from 'class-validator'
import { EstadoPasoOrden } from '../paso-produccion.entity'
import { ApiProperty } from '@nestjs/swagger'

export class CreatePasoProduccionDto {
  @ApiProperty({ description: 'Nombre del paso', example: 'Corte' })
  @IsString()
  @IsNotEmpty()
  nombre: string

  @ApiProperty({ description: 'ID de la orden', format: 'uuid' })
  @IsUUID()
  orden: string

  @ApiProperty({ description: 'Código interno del paso', example: 'P-001' })
  @IsString()
  codigoInterno: string

  @ApiProperty({ description: 'Cantidad requerida', example: 100 })
  @IsNumber()
  cantidadRequerida: number

  @ApiProperty({ description: 'Número de secuencia del paso', example: 1 })
  @IsNumber()
  numeroPaso: number
}
