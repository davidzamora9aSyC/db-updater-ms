import { IsEnum, IsUUID, IsDate, IsOptional } from 'class-validator';
import { TipoEstadoRecurso } from '../estado-recurso.entity';

export class CreateEstadoRecursoDto {
  @IsUUID()
  recurso: string;

  @IsEnum(TipoEstadoRecurso)
  estado: TipoEstadoRecurso;

  @IsDate()
  inicio: Date;

  @IsOptional()
  @IsDate()
  fin?: Date;
}
