import { IsEnum, IsUUID, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEstadoSesion } from '../estado-sesion.entity';

export class CreateEstadoSesionDto {
  @IsUUID()
  sesionTrabajo: string;

  @IsEnum(TipoEstadoSesion)
  estado: TipoEstadoSesion;

  @Type(() => Date)
  @IsDate()
  inicio: Date;
}
