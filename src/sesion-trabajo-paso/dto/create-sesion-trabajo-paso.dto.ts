import { IsUUID, IsNumber, IsOptional } from 'class-validator';

export class CreateSesionTrabajoPasoDto {
  @IsUUID()
  sesionTrabajo: string;

  @IsUUID()
  pasoOrden: string;

  @IsOptional()
  @IsNumber()
  cantidadAsignada: number;

}
