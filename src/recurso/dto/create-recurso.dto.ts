import { IsUUID } from 'class-validator';

export class CreateRecursoDto {
  @IsUUID()
  trabajador: string;

  @IsUUID()
  maquina: string;
}