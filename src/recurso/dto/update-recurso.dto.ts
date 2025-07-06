import { IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class UpdateRecursoDto {
  @IsOptional()
  @IsUUID()
  trabajador?: string;

  @IsOptional()
  @IsUUID()
  maquina?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}