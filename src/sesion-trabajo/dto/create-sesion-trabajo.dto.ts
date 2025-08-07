import { IsUUID, IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateSesionTrabajoDto {
  @IsUUID()
  trabajador: string;

  @IsUUID()
  maquina: string;

}
