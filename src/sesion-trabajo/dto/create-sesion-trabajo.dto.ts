import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { EstadoSesionTrabajo } from '../sesion-trabajo.entity';

export class CreateSesionTrabajoDto {
  @IsUUID()
  trabajador: string;

  @IsUUID()
  maquina: string;

  @IsOptional()
  @IsEnum(EstadoSesionTrabajo)
  estado?: EstadoSesionTrabajo;
}
