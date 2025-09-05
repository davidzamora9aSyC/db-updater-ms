import { IsUUID, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialOrdenDto {
  @ApiProperty({ description: 'ID de la orden', format: 'uuid' })
  @IsUUID()
  orden: string;

  @ApiProperty({ description: 'Código del material', example: 'MAT-001' })
  @IsString()
  codigo: string;

  @ApiProperty({ description: 'Descripción del material', example: 'Acero inoxidable 2mm' })
  @IsString()
  descripcion: string;

  @ApiProperty({ description: 'Unidad de medida', example: 'kg' })
  @IsString()
  unidad: string;

  @ApiProperty({ description: 'Cantidad requerida', example: 100 })
  @IsInt()
  cantidad: number;
}
