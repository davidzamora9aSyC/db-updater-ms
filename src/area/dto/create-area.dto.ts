import { IsString } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  nombre: string;
}
