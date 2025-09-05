import { IsEnum, IsUUID, IsDate, IsOptional } from 'class-validator';
import { TipoEstadoSesion } from '../estado-sesion.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEstadoSesionDto {
  @ApiPropertyOptional({ description: 'ID de la sesión de trabajo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sesionTrabajo?: string;

  @ApiPropertyOptional({ description: 'Estado de la sesión', enum: TipoEstadoSesion })
  @IsOptional()
  @IsEnum(TipoEstadoSesion)
  estado?: TipoEstadoSesion;

  @ApiPropertyOptional({ description: 'Inicio del estado', type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  inicio?: Date;

  @ApiPropertyOptional({ description: 'Fin del estado', type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  fin?: Date;
}
