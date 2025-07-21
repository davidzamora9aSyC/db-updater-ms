import { IsUUID } from 'class-validator';

export class CreateSesionTrabajoPasoDto {
  @IsUUID()
  sesionTrabajo: string;

  @IsUUID()
  pasoOrden: string;
}
