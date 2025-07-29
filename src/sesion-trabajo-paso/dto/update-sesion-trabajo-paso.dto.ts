import { IsUUID, IsOptional, IsNumber, IsIn } from 'class-validator';
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
  @IsIn(['activo', 'pausado', 'finalizado'])
  estado?: EstadoSesionTrabajoPaso;
}
