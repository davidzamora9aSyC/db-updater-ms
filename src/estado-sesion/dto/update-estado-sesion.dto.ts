import { IsEnum, IsUUID, IsDate, IsOptional } from 'class-validator';
import { TipoEstadoSesion } from '../estado-sesion.entity';

export class UpdateEstadoSesionDto {
  @IsOptional()
  @IsUUID()
  sesionTrabajo?: string;

  @IsOptional()
  @IsEnum(TipoEstadoSesion)
  estado?: TipoEstadoSesion;

  @IsOptional()
  @IsDate()
  inicio?: Date;

  @IsOptional()
  @IsDate()
  fin?: Date;
}
