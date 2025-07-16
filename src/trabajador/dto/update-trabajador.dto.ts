import { IsOptional, IsString, IsBoolean, IsIn, IsISO8601 } from 'class-validator';

export enum GrupoTrabajador {
  PRODUCCION = 'produccion',
  ADMIN = 'admin'
}

export enum TurnoTrabajador {
  MANANA = 'mañana',
  TARDE = 'tarde',
  NOCHE = 'noche'
}

export enum EstadoTrabajador {
  CREADO = 'creado',
  EN_PRODUCCION = 'en produccion',
  EN_DESCANSO = 'en descanso',
  FUERA_DE_TURNO = 'fuera de turno',
  INACTIVO_EN_TURNO = 'inactivo en turno'
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

  @IsOptional()
  @IsIn([
    EstadoTrabajador.CREADO,
    EstadoTrabajador.EN_PRODUCCION,
    EstadoTrabajador.EN_DESCANSO,
    EstadoTrabajador.FUERA_DE_TURNO,
    EstadoTrabajador.INACTIVO_EN_TURNO,
  ])
  estado?: EstadoTrabajador;
}