import { IsUUID, IsEnum, IsDate, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { EstadoSesionTrabajo } from '../sesion-trabajo.entity';

export class UpdateSesionTrabajoDto {
  @IsOptional()
  @IsUUID()
  trabajador?: string;

  @IsOptional()
  @IsUUID()
  maquina?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: Date;

  @IsOptional()
  @IsDateString()
  fechaFin?: Date;
  
  @IsOptional()
  @IsEnum(EstadoSesionTrabajo)
  estado?: EstadoSesionTrabajo;

  @IsOptional()
  @IsNumber()
  cantidadProducida?: number;

  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;
}
