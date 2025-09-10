import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateUmbralesAlertaDto {
  @ApiPropertyOptional({ description: 'Máximo de descansos por día por trabajador', example: 6, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDescansosDiariosPorTrabajador?: number;

  @ApiPropertyOptional({ description: 'Duración máxima de una pausa (minutos)', example: 30, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDuracionPausaMinutos?: number;

  @ApiPropertyOptional({ description: 'Minutos de inactividad para considerar alerta de sin actividad', example: 5, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minutosInactividadParaNPT?: number;
}

