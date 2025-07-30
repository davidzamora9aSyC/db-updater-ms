import { IsUUID, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { EstadoSesionTrabajoPaso } from '../sesion-trabajo-paso.entity';

export class CreateSesionTrabajoPasoDto {
  @IsUUID()
  sesionTrabajo: string;

  @IsUUID()
  pasoOrden: string;

  @IsNumber()
  cantidadAsignada: number;

  @IsOptional()
  @IsNumber()
  cantidadProducida?: number;

  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;

  @IsOptional()
  @IsEnum(EstadoSesionTrabajoPaso)
  estado?: EstadoSesionTrabajoPaso;
}
