import { IsUUID, IsIn, IsDateString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AcumuladorDto {
  @ApiProperty({ description: 'ID de la máquina', format: 'uuid' })
  @IsUUID()
  maquina: string

  @ApiProperty({ description: 'ID del paso', format: 'uuid' })
  @IsUUID()
  paso: string

  @ApiProperty({ description: 'Tipo de acumulación', enum: ['pedal', 'pieza'] })
  @IsIn(['pedal', 'pieza'])
  tipo: 'pedal' | 'pieza'

  @ApiPropertyOptional({ description: 'Minuto ISO desde el cual acumular', type: String, format: 'date-time', example: '2025-09-04T14:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  minutoInicio: string
}
