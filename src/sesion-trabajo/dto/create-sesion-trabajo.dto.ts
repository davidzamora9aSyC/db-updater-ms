import { IsUUID, IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateSesionTrabajoDto {
  @IsUUID()
  trabajador: string;

  @IsUUID()
  maquina: string;

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
