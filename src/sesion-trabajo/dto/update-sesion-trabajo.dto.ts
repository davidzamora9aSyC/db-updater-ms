import { IsUUID, IsOptional, IsDateString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateSesionTrabajoDto {
  @IsOptional()
  @IsBoolean()
  fechaFin?: boolean;

  
  @IsOptional()
  @IsNumber()
  cantidadProducida?: number;

  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;
}
