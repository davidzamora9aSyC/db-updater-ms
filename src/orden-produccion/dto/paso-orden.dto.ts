import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { EstadoPasoOrden } from '../../paso-produccion/paso-produccion.entity';

export class PasoOrdenDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  codigoInterno: string;

  @IsNumber()
  cantidadRequerida: number;

  @IsOptional()
  @IsNumber()
  cantidadProducida?: number;

  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;

  @IsOptional()
  @IsEnum(EstadoPasoOrden)
  estado?: EstadoPasoOrden;
}
