import { IsUUID, IsOptional } from 'class-validator';

export class UpdateSesionTrabajoPasoDto {
  @IsOptional()
  @IsUUID()
  sesionTrabajo?: string;

  @IsOptional()
  @IsUUID()
  pasoOrden?: string;
}
