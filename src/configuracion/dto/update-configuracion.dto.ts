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
}
