import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class CreateEstadoTrabajadorDto {
  @IsUUID()
  trabajador: string;

  @IsBoolean()
  descanso: boolean;

}
