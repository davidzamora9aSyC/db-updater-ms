import { IsOptional, IsString, IsIn, IsISO8601 } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum GrupoTrabajador {
  PRODUCCION = 'produccion',
  ADMIN = 'admin'
}

export enum TurnoTrabajador {
  MANANA = 'mañana',
  TARDE = 'tarde',
  NOCHE = 'noche'
}

export class UpdateTrabajadorDto {
  @ApiPropertyOptional({ description: 'Nombre del trabajador', example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Identificación del trabajador', example: '104567890' })
  @IsOptional()
  @IsString()
  identificacion?: string;

  @ApiPropertyOptional({ description: 'Grupo del trabajador', enum: GrupoTrabajador })
  @IsOptional()
  @IsIn([GrupoTrabajador.PRODUCCION, GrupoTrabajador.ADMIN])
  grupo?: GrupoTrabajador;

  @ApiPropertyOptional({ description: 'Turno asignado', enum: TurnoTrabajador })
  @IsOptional()
  @IsIn([TurnoTrabajador.MANANA, TurnoTrabajador.TARDE, TurnoTrabajador.NOCHE])
  turno?: TurnoTrabajador;

  @ApiPropertyOptional({ description: 'Fecha de inicio', type: String, format: 'date' })
  @IsOptional()
  @IsISO8601()
  fechaInicio?: string;

}
