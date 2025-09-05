import { IsEnum, IsUUID, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEstadoSesion } from '../estado-sesion.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEstadoSesionDto {
  @ApiProperty({ description: 'ID de la sesión de trabajo', format: 'uuid' })
  @IsUUID()
  sesionTrabajo: string;

  @ApiProperty({ description: 'Estado de la sesión', enum: TipoEstadoSesion })
  @IsEnum(TipoEstadoSesion)
  estado: TipoEstadoSesion;

  @ApiProperty({ description: 'Inicio del estado', type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  inicio: Date;

  @ApiPropertyOptional({ description: 'Fin del estado', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fin?: Date;
}
