import { IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class UpdateRecursoDto {
  @IsOptional()
  @IsMongoId()
  trabajador?: string;

  @IsOptional()
  @IsMongoId()
  maquina?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}