import { IsString, Length, IsISO8601, IsEnum, IsOptional, IsUUID } from 'class-validator'
import { TipoMaquina } from './create-maquina.dto'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateMaquinaDto {

  @ApiPropertyOptional({ description: 'Nombre de la máquina', example: 'Troqueladora 1' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nombre?: string

  @ApiPropertyOptional({ description: 'Ubicación física', example: 'Planta A' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  ubicacion?: string

  @ApiPropertyOptional({ description: 'Fecha de instalación', type: String, format: 'date' })
  @IsOptional()
  @IsISO8601()
  fechaInstalacion?: string

  @ApiPropertyOptional({ description: 'Tipo de máquina', enum: TipoMaquina })
  @IsOptional()
  @IsEnum(TipoMaquina)
  tipo?: TipoMaquina

  @ApiPropertyOptional({ description: 'Observaciones', maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  observaciones?: string

  @ApiPropertyOptional({ description: 'ID del área', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  areaId?: string
}
