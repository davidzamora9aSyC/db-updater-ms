import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class CreateEstadoMaquinaDto {
  @IsUUID()
  maquina: string;

  @IsBoolean()
  mantenimiento: boolean;

  @IsDateString()
  inicio: Date;

  @IsOptional()
  @IsDateString()
  fin?: Date;
}
