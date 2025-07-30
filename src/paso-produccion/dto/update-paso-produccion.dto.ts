import { IsOptional, IsString, IsNotEmpty, IsNumber, IsUUID, IsEnum } from 'class-validator'
import { EstadoPasoOrden } from '../paso-produccion.entity'

export class UpdatePasoProduccionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string

  @IsOptional()
  @IsUUID()
  orden?: string

  @IsOptional()
  @IsString()
  codigoInterno?: string

  @IsOptional()
  @IsNumber()
  cantidadRequerida?: number

  @IsOptional()
  @IsNumber()
  cantidadProducida?: number

  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number

  @IsOptional()
  @IsEnum(EstadoPasoOrden)
  estado?: EstadoPasoOrden
}