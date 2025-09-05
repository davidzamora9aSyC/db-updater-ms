import { IsString, IsNotEmpty, IsIn, IsISO8601 } from 'class-validator';
import { GrupoTrabajador, TurnoTrabajador } from './update-trabajador.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTrabajadorDto {
  @ApiProperty({ description: 'Nombre del trabajador', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Identificación del trabajador', example: '104567890' })
  @IsString()
  @IsNotEmpty()
  identificacion: string;

  @ApiProperty({ description: 'Grupo del trabajador', enum: GrupoTrabajador })
  @IsIn([GrupoTrabajador.PRODUCCION, GrupoTrabajador.ADMIN])
  grupo: GrupoTrabajador;

  @ApiProperty({ description: 'Turno asignado', enum: TurnoTrabajador })
  @IsIn([TurnoTrabajador.MANANA, TurnoTrabajador.TARDE, TurnoTrabajador.NOCHE])
  turno: TurnoTrabajador;

  @ApiProperty({ description: 'Fecha de inicio', type: String, format: 'date', example: '2025-09-04' })
  @IsISO8601()
  fechaInicio: string;

}
