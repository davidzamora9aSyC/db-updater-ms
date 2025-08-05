import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateEstadoMaquinaDto {
  @IsOptional()
  @IsUUID()
  maquina?: string;

  @IsOptional()
  @IsBoolean()
  mantenimiento?: boolean;

  @IsOptional()
  @IsDateString()
  inicio?: Date;

  @IsOptional()
  @IsDateString()
  fin?: Date;
}
