import { IsString, IsOptional, IsIn } from 'class-validator'

export class CrearEventoDto {
  @IsString()
  recursoId: string

  @IsOptional()
  @IsString()
  ordenId?: string

  @IsOptional()
  @IsString()
  pasoId?: string
}