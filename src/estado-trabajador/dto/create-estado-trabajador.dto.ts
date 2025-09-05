import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEstadoTrabajadorDto {
  @ApiProperty({ description: 'ID del trabajador', format: 'uuid' })
  @IsUUID()
  trabajador: string;

  @ApiProperty({ description: 'Si está en descanso', example: false })
  @IsBoolean()
  descanso: boolean;

}
