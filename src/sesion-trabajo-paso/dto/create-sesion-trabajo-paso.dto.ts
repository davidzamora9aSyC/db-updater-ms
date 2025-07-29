import { IsUUID, IsNumber, IsOptional, IsIn } from 'class-validator';
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
  @IsIn(['activo', 'pausado', 'finalizado'])
  estado?: EstadoSesionTrabajoPaso;
}
