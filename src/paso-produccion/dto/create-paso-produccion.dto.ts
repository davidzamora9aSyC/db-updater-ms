import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional, IsEnum } from 'class-validator'
import { EstadoPasoOrden } from '../paso-produccion.entity'

export class CreatePasoProduccionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsUUID()
  orden: string

  @IsString()
  codigoInterno: string

  @IsNumber()
  cantidadRequerida: number

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