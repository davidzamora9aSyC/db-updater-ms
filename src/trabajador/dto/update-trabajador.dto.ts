import { IsOptional, IsString, IsIn, IsISO8601 } from 'class-validator';

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
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  identificacion?: string;

  @IsOptional()
  @IsIn([GrupoTrabajador.PRODUCCION, GrupoTrabajador.ADMIN])
  grupo?: GrupoTrabajador;

  @IsOptional()
  @IsIn([TurnoTrabajador.MANANA, TurnoTrabajador.TARDE, TurnoTrabajador.NOCHE])
  turno?: TurnoTrabajador;

  @IsOptional()
  @IsISO8601()
  fechaInicio?: string;

}