import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({ description: 'Nombre de la empresa', example: 'Acme S.A.' })
  @IsString()
  nombre: string;
}
