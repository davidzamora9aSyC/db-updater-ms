import { IsEnum, IsUUID, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEstadoRecurso } from '../estado-recurso.entity';

export class CreateEstadoRecursoDto {
  @IsUUID()
  recurso: string;

  @IsEnum(TipoEstadoRecurso)
  estado: TipoEstadoRecurso;

  @Type(() => Date)
  @IsDate()
  inicio: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fin?: Date;
}