import { IsString, IsIn } from 'class-validator'

export class CreateBotonDto {
  @IsString()
  recursoId: string

  @IsString()
  @IsIn(['descanso', 'mantenimiento', 'volver'])
  tipo: string
}