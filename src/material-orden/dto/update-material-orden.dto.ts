import { IsUUID, IsString, IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMaterialOrdenDto {
  @ApiPropertyOptional({ description: 'ID de la orden', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  orden?: string;

  @ApiPropertyOptional({ description: 'Código del material', example: 'MAT-001' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({ description: 'Descripción del material' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Unidad de medida', example: 'kg' })
  @IsOptional()
  @IsString()
  unidad?: string;

  @ApiPropertyOptional({ description: 'Cantidad requerida', example: 100 })
  @IsOptional()
  @IsInt()
  cantidad?: number;
}
