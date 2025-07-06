import { IsUUID } from 'class-validator';

export class AsignacionIdDto {
  @IsUUID()
  id: string;
}