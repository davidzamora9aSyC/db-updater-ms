import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEstadoMaquinaDto {


  @ApiPropertyOptional({ description: 'Fecha de fin del estado', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  fin?: Date;
}
