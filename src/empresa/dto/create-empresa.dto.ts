import { IsString } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  nombre: string;
}
