import { IsUUID, IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateMaterialOrdenDto {
  @IsOptional()
  @IsUUID()
  orden?: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  unidad?: string;

  @IsOptional()
  @IsInt()
  cantidad?: number;
}
