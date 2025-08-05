import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateEstadoTrabajadorDto {
  @IsOptional()
  @IsUUID()
  trabajador?: string;

  @IsOptional()
  @IsBoolean()
  descanso?: boolean;

  @IsOptional()
  @IsDateString()
  inicio?: Date;

  @IsOptional()
  @IsDateString()
  fin?: Date;
}
