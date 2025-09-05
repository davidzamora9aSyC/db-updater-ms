import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsInt,
} from 'class-validator';
import { EstadoPasoOrden } from '../../paso-produccion/paso-produccion.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PasoOrdenDto {
  @ApiProperty({ description: 'Nombre del paso', example: 'Corte' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Código interno del paso', example: 'P-001' })
  @IsString()
  codigoInterno: string;

  @ApiProperty({ description: 'Cantidad requerida', example: 100 })
  @IsNumber()
  cantidadRequerida: number;

  @ApiPropertyOptional({ description: 'Cantidad producida', example: 0 })
  @IsOptional()
  @IsNumber()
  cantidadProducida?: number;

  @ApiPropertyOptional({ description: 'Cantidad de pedaleos', example: 0 })
  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;

  @ApiPropertyOptional({ description: 'Estado del paso', enum: EstadoPasoOrden })
  @IsOptional()
  @IsEnum(EstadoPasoOrden)
  estado?: EstadoPasoOrden;

  @ApiProperty({ description: 'Número de secuencia', example: 1 })
  @IsInt()
  @IsNotEmpty()
  numeroPaso: number;
}
