import { IsUUID, IsOptional, IsNumber } from 'class-validator';

export class UpdateSesionTrabajoPasoDto {



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
