import { IsOptional, IsInt, Min, IsString } from 'class-validator';

export class UpdateConfiguracionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  minutosInactividadParaNPT?: number;

  @IsOptional()
  @IsString()
  zonaHorariaCliente?: string;
}
