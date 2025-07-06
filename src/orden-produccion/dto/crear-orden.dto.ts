import { IsString, IsArray, IsOptional } from 'class-validator'

export class CrearOrdenDto {
  @IsString()
  codigo: string

  @IsArray()
  @IsOptional()
  pasos?: string[]
}