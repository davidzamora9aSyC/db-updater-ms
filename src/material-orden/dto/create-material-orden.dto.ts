import { IsUUID, IsString, IsInt } from 'class-validator';

export class CreateMaterialOrdenDto {
  @IsUUID()
  orden: string;

  @IsString()
  codigo: string;

  @IsString()
  descripcion: string;

  @IsString()
  unidad: string;

  @IsInt()
  cantidad: number;
}
