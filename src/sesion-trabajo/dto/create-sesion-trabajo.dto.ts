import { IsUUID, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSesionTrabajoDto {
  @ApiProperty({ description: 'ID del trabajador', format: 'uuid' })
  @IsUUID()
  trabajador: string;

  @ApiProperty({ description: 'ID de la máquina', format: 'uuid' })
  @IsUUID()
  maquina: string;

}
