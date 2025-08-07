import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateEstadoMaquinaDto {


  @IsOptional()
  @IsDateString()
  fin?: Date;
}
