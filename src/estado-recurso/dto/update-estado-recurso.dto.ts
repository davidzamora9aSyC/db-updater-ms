import { IsEnum, IsUUID, IsDate, IsOptional } from 'class-validator';
import { TipoEstadoRecurso } from '../estado-recurso.entity';

export class UpdateEstadoRecursoDto {
  @IsOptional()
  @IsUUID()
  recurso?: string;

  @IsOptional()
  @IsEnum(TipoEstadoRecurso)
  estado?: TipoEstadoRecurso;

  @IsOptional()
  @IsDate()
  inicio?: Date;

  @IsOptional()
  @IsDate()
  fin?: Date;
}
