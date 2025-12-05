import { IsUUID, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSesionTrabajoPasoDto {
  @ApiProperty({ description: 'ID de la sesión de trabajo', format: 'uuid' })
  @IsUUID()
  sesionTrabajo: string;

  @ApiProperty({ description: 'ID del paso de la orden', format: 'uuid' })
  @IsUUID()
  pasoOrden: string;

  @ApiPropertyOptional({ description: 'Cantidad asignada al paso', example: 50 })
  @IsOptional()
  @IsNumber()
  cantidadAsignada: number;

  @ApiPropertyOptional({ description: 'Indica si fue asignado por admin' })
  @IsOptional()
  @IsBoolean()
  porAdministrador?: boolean;

  @ApiPropertyOptional({ description: 'Marcar la asignación como creada desde tablet' })
  @IsOptional()
  @IsBoolean()
  desdeTablet?: boolean;
}
