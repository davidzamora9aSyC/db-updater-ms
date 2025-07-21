import { IsUUID, IsEnum, IsDate, IsOptional } from 'class-validator';
import { EstadoSesionTrabajo } from '../sesion-trabajo.entity';

export class UpdateSesionTrabajoDto {
  @IsOptional()
  @IsUUID()
  recurso?: string;

  @IsOptional()
  @IsUUID()
  pasosOrden?: string;

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
