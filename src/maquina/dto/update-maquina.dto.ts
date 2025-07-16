import { IsString, Length, IsISO8601, IsEnum, IsOptional } from 'class-validator'
import { EstadoMaquina, TipoMaquina } from './create-maquina.dto'

export class UpdateMaquinaDto {

  @IsOptional()
  @IsString()
  @Length(1, 50)
  nombre?: string

  @IsOptional()
  @IsEnum(EstadoMaquina)
  estado?: EstadoMaquina

  @IsOptional()
  @IsString()
  @Length(1, 100)
  ubicacion?: string

  @IsOptional()
  @IsISO8601()
  fechaInstalacion?: string

  @IsOptional()
  @IsEnum(TipoMaquina)
  tipo?: TipoMaquina

  @IsOptional()
  @IsString()
  @Length(0, 255)
  observaciones?: string
}