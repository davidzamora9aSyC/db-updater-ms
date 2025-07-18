import { IsString, IsOptional } from 'class-validator';

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  nombre?: string;
}
