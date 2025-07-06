import { IsString, IsInt, IsDate } from 'class-validator';

export class CreateIndicadorDto {
  @IsString()
  recursoId: string;

  @IsInt()
  piezas: number;

  @IsInt()
  pedalazos: number;

  @IsDate()
  timestamp: Date;
}