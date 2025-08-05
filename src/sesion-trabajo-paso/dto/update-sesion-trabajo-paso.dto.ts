import { IsUUID, IsOptional, IsNumber } from 'class-validator';

export class UpdateSesionTrabajoPasoDto {
  @IsOptional()
  @IsUUID()
  sesionTrabajo?: string;

  @IsOptional()
  @IsUUID()
  pasoOrden?: string;

  @IsOptional()
  @IsNumber()
  cantidadAsignada?: number;

  @IsOptional()
  @IsNumber()
  cantidadProducida?: number;

  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;

}
