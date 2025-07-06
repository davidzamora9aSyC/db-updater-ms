import { IsMongoId } from 'class-validator';

export class CreateRecursoDto {
  @IsMongoId()
  trabajador: string;

  @IsMongoId()
  maquina: string;
}