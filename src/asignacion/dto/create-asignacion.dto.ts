import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAsignacionDto {
  @IsString()
  @IsNotEmpty()
  trabajadorId: string;

  @IsString()
  @IsNotEmpty()
  maquinaId: string;
}