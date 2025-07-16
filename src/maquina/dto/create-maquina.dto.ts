import { IsString, IsUUID, Length, IsISO8601 } from 'class-validator'

export class CreateMaquinaDto {

  @IsString()
  @Length(1, 50)
  nombre: string

  @IsString()
  @Length(1, 100)
  ubicacion: string

  @IsISO8601()
  fechaInstalacion: string
}