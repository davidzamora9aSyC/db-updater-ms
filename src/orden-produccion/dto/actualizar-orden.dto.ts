import { PartialType } from '@nestjs/mapped-types';
import { CrearOrdenDto } from './crear-orden.dto';
import { IsUUID, IsOptional } from 'class-validator';

export class ActualizarOrdenDto extends PartialType(CrearOrdenDto) {
  @IsOptional()
  @IsUUID()
  maquina?: string;
}
