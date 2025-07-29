import { PartialType } from '@nestjs/mapped-types';
import { CrearOrdenDto } from './crear-orden.dto';

export class ActualizarOrdenDto extends PartialType(CrearOrdenDto) {}
