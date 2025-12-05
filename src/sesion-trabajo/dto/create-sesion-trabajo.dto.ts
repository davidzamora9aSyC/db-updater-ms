import { IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSesionTrabajoDto {
  @ApiProperty({ description: 'ID del trabajador', format: 'uuid' })
  @IsUUID()
  trabajador: string;

  @ApiProperty({ description: 'ID de la máquina', format: 'uuid' })
  @IsUUID()
  maquina: string;

  @ApiPropertyOptional({ description: 'Marcar la sesión como creada desde tablet' })
  @IsOptional()
  @IsBoolean()
  desdeTablet?: boolean;

}
