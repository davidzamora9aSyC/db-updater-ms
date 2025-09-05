import { IsString, Length, IsISO8601, IsEnum, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum TipoMaquina {
  TROQUELADORA = 'troqueladora',
  TALADRO = 'taladro',
  HORNO = 'horno',
  VULCANIZADORA = 'vulcanizadora'
}

export class CreateMaquinaDto {

  @ApiProperty({ description: 'Nombre de la máquina', example: 'Troqueladora 1' })
  @IsString()
  @Length(1, 50)
  nombre: string

  @ApiProperty({ description: 'Código interno', example: 'M-TRQ-01' })
  @IsString()
  @Length(1, 50)
  codigo: string

  @ApiProperty({ description: 'Ubicación física', example: 'Planta A' })
  @IsString()
  @Length(1, 100)
  ubicacion: string

  @ApiProperty({ description: 'Fecha de instalación', type: String, format: 'date' })
  @IsISO8601()
  fechaInstalacion: string

  @ApiProperty({ description: 'Tipo de máquina', enum: TipoMaquina })
  @IsEnum(TipoMaquina)
  tipo: TipoMaquina

  @ApiProperty({ description: 'ID del área', format: 'uuid' })
  @IsUUID()
  areaId: string

  @ApiProperty({ description: 'Observaciones', required: false, maxLength: 255 })
  @IsString()
  @Length(0, 255)
  observaciones?: string
}
