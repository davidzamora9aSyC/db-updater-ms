import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAreaDto {
  @ApiPropertyOptional({ description: 'Nombre del área', example: 'Corte' })
  @IsOptional()
  @IsString()
  nombre?: string;
}
