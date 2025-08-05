import { IsUUID, IsOptional, IsDateString, IsNumber } from 'class-validator';

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
  @IsNumber()
  cantidadProducida?: number;

  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;
}
