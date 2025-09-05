import { IsUUID, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSesionTrabajoPasoDto {



  @ApiPropertyOptional({ description: 'Cantidad asignada al paso', example: 50 })
  @IsOptional()
  @IsNumber()
  cantidadAsignada?: number;

  @ApiPropertyOptional({ description: 'Cantidad producida', example: 30 })
  @IsOptional()
  @IsNumber()
  cantidadProducida?: number;

  @ApiPropertyOptional({ description: 'Cantidad de pedaleos', example: 60 })
  @IsOptional()
  @IsNumber()
  cantidadPedaleos?: number;

}
