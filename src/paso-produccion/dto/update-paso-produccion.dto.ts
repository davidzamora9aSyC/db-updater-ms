import { IsOptional, IsString, IsNotEmpty, IsNumber, IsUUID, IsEnum } from 'class-validator'
import { EstadoPasoOrden } from '../paso-produccion.entity'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdatePasoProduccionDto {
  @ApiPropertyOptional({ description: 'Nombre del paso', example: 'Corte' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string

  @ApiPropertyOptional({ description: 'ID de la orden', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  orden?: string

  @ApiPropertyOptional({ description: 'Código interno', example: 'P-001' })
  @IsOptional()
  @IsString()
  codigoInterno?: string

  @ApiPropertyOptional({ description: 'Cantidad requerida', example: 100 })
  @IsOptional()
  @IsNumber()
  cantidadRequerida?: number

  @ApiPropertyOptional({ description: 'Cantidad producida', example: 40 })
  @IsOptional()
  @IsNumber()
  cantidadProducida?: number

  @ApiPropertyOptional({ description: 'Cantidad de pedaleos', example: 80 })
  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number


  @ApiPropertyOptional({ description: 'Número de secuencia', example: 1 })
  @IsOptional()
  @IsNumber()
  numeroPaso?: number
}
