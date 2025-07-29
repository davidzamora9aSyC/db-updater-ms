import { IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateSesionTrabajoDto {
  @IsUUID()
  trabajador: string;

  @IsUUID()
  maquina: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: Date;

}
