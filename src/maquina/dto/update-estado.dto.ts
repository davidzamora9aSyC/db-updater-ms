import { IsString, IsIn } from 'class-validator'

export class UpdateEstadoDto {
  @IsString()
  @IsIn(['activo', 'inactivo', 'mantenimiento'])
  estado: string
}