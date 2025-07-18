import { IsUUID, IsEnum, IsDate, IsOptional } from 'class-validator';
import { EstadoSesionTrabajo } from '../sesion-trabajo.entity';

export class CreateSesionTrabajoDto {
  @IsUUID()
  recurso: string;

  @IsUUID()
  pasoOrden: string;

  @IsDate()
  fechaInicio: Date;

  @IsOptional()
  @IsDate()
  fechaFin?: Date;

  @IsOptional()
  @IsEnum(EstadoSesionTrabajo)
  estado?: EstadoSesionTrabajo;
}
