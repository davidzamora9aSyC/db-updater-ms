import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaDto {
  @ApiProperty({ description: 'Nombre del área', example: 'Corte' })
  @IsString()
  nombre: string;
}
