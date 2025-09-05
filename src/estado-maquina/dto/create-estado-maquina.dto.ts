import { IsUUID, IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEstadoMaquinaDto {
  @ApiProperty({ description: 'ID de la máquina', format: 'uuid' })
  @IsUUID()
  maquina: string;

  @ApiProperty({ description: 'Si está en mantenimiento', example: false })
  @IsBoolean()
  mantenimiento: boolean;

}
