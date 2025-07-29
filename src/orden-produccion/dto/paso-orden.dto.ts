import { IsString, IsNotEmpty, IsNumber, IsIn, IsOptional } from 'class-validator';
import { EstadoPaso } from '../../paso-produccion/dto/create-paso-produccion.dto';

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
  @IsString()
  @IsIn(['pendiente', 'en_progreso', 'completado'])
  estado?: EstadoPaso;
}
