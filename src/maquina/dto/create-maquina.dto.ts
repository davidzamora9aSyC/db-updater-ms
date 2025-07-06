import { IsString, Length } from 'class-validator'

export class CreateMaquinaDto {
  @IsString()
  @Length(1, 50)
  nombre: string
}