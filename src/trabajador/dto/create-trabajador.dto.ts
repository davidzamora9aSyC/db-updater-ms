import { IsString, IsNotEmpty, IsIn, IsISO8601 } from 'class-validator';
import { GrupoTrabajador, TurnoTrabajador } from './update-trabajador.dto';

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

  @IsISO8601()
  fechaInicio: string;

}