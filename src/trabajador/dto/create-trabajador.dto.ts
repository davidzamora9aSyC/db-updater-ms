import { IsString, IsNotEmpty, IsIn, IsISO8601 } from 'class-validator';
import { EstadoTrabajador, GrupoTrabajador, TurnoTrabajador } from './update-trabajador.dto';

export class CreateTrabajadorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  identificacion: string;

  @IsIn([GrupoTrabajador.PRODUCCION, GrupoTrabajador.ADMIN])
  grupo: GrupoTrabajador;

  @IsIn([TurnoTrabajador.MANANA, TurnoTrabajador.TARDE, TurnoTrabajador.NOCHE])
  turno: TurnoTrabajador;

  @IsIn([
    EstadoTrabajador.CREADO,
    EstadoTrabajador.EN_PRODUCCION,
    EstadoTrabajador.EN_DESCANSO,
    EstadoTrabajador.FUERA_DE_TURNO,
    EstadoTrabajador.INACTIVO_EN_TURNO,
  ])
  estado: EstadoTrabajador;

  @IsISO8601()
  fechaInicio: string;

}