import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmpresaDto {
  @ApiPropertyOptional({ description: 'Nombre de la empresa', example: 'Acme S.A.' })
  @IsOptional()
  @IsString()
  nombre?: string;
}
