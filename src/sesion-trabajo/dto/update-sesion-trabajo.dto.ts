import { IsUUID, IsEnum, IsDate, IsOptional } from 'class-validator';
import { EstadoSesionTrabajo } from '../sesion-trabajo.entity';

export class UpdateSesionTrabajoDto {
  @IsOptional()
  @IsUUID()
  trabajador?: string;

  @IsOptional()
  @IsUUID()
  maquina?: string;

  @IsOptional()
  @IsDate()
  fechaInicio?: Date;

  @IsOptional()
  @IsDate()
  fechaFin?: Date;

  @IsOptional()
  @IsEnum(EstadoSesionTrabajo)
  estado?: EstadoSesionTrabajo;
}
