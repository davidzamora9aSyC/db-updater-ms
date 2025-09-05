import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Nombre de usuario', example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Contraseña', minLength: 3, example: 'secret123' })
  @IsString()
  @MinLength(3)
  password: string;
}
