import { IsUUID, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { EstadoSesionTrabajoPaso } from '../sesion-trabajo-paso.entity';

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
  @IsEnum(EstadoSesionTrabajoPaso)
  estado?: EstadoSesionTrabajoPaso;
}
