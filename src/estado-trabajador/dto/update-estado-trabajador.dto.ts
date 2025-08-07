import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateEstadoTrabajadorDto {



  @IsOptional()
  @IsDateString()
  fin?: Date;
}
