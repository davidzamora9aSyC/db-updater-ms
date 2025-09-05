import { IsUUID, IsOptional, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSesionTrabajoDto {
  @ApiPropertyOptional({ description: 'Marcar fin de la sesión', type: Boolean })
  @IsOptional()
  @IsBoolean()
  fechaFin?: boolean;

  
  @ApiPropertyOptional({ description: 'Cantidad producida', example: 120 })
  @IsOptional()
  @IsNumber()
  cantidadProducida?: number;

  @ApiPropertyOptional({ description: 'Cantidad de pedaleos', example: 300 })
  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;
}
