import { IsString, IsOptional } from 'class-validator';

export class UpdateAreaDto {
  @IsOptional()
  @IsString()
  nombre?: string;
}
