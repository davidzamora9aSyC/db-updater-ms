import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateTrabajadorDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  identificacion?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}