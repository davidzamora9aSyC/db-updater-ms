import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfiguracionDto {
  @ApiPropertyOptional({ description: 'Minutos de inactividad para NPT', minimum: 1, example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minutosInactividadParaNPT?: number;

  @ApiPropertyOptional({ description: 'Zona horaria del cliente (IANA TZ)', example: 'America/Bogota' })
  @IsOptional()
  @IsString()
  zonaHorariaCliente?: string;

  @ApiPropertyOptional({ description: 'Máximo de descansos por día por trabajador', minimum: 1, example: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDescansosDiariosPorTrabajador?: number;

  @ApiPropertyOptional({ description: 'Duración máxima de una pausa en minutos', minimum: 1, example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDuracionPausaMinutos?: number;

  @ApiPropertyOptional({ description: 'Horas máximas de una sesión abierta', minimum: 1, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxHorasSesionAbierta?: number;
}
