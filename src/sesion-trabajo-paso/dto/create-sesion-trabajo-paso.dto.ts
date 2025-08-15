import { IsUUID, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateSesionTrabajoPasoDto {
  @IsUUID()
  sesionTrabajo: string;

  @IsUUID()
  pasoOrden: string;

  @IsOptional()
  @IsNumber()
  cantidadAsignada: number;

  @IsOptional()
  @IsBoolean()
  porAdministrador?: boolean;
}
