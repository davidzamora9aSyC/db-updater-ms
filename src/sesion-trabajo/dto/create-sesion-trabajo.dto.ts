import { IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { EstadoSesionTrabajo } from '../sesion-trabajo.entity';

export class CreateSesionTrabajoDto {
  @IsUUID()
  trabajador: string;

  @IsUUID()
  maquina: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: Date;

  @IsOptional()
  @IsEnum(EstadoSesionTrabajo)
  estado?: EstadoSesionTrabajo;
}
