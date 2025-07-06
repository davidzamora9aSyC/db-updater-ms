import { IsMongoId } from 'class-validator';

export class AsignacionIdDto {
  @IsMongoId()
  id: string;
}