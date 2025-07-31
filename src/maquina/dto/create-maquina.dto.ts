import { IsString, Length, IsISO8601, IsEnum } from 'class-validator'

export enum EstadoMaquina {
  ACTIVA = 'activa',
  NO_ACTIVA = 'no activa'
}

export enum TipoMaquina {
  TROQUELADORA = 'troqueladora',
  TALADRO = 'taladro',
  HORNO = 'horno',
  VULCANIZADORA = 'vulcanizadora'
}

export class CreateMaquinaDto {

  @IsString()
  @Length(1, 50)
  nombre: string

  @IsString()
  @Length(1, 50)
  codigo: string

  @IsEnum(EstadoMaquina)
  estado: EstadoMaquina

  @IsString()
  @Length(1, 100)
  ubicacion: string

  @IsISO8601()
  fechaInstalacion: string

  @IsEnum(TipoMaquina)
  tipo: TipoMaquina

  @IsString()
  @Length(0, 255)
  observaciones?: string
}