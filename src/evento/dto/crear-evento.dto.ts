import { IsUUID, IsOptional } from 'class-validator'

export class CrearEventoDto {
  @IsUUID()
  recursoId: string

  @IsOptional()
  @IsUUID()
  ordenId?: string

  @IsOptional()
  @IsUUID()
  pasoId?: string
}