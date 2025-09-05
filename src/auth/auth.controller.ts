import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login con usuario/clave' })
  @ApiBody({ description: 'Credenciales de acceso', type: LoginDto })
  @ApiOkResponse({ description: 'JWT emitido', schema: { example: {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    token_type: 'Bearer',
    expires_in: 28800,
    user: { username: 'admin', name: 'Administrador' }
  } } })
  async login(@Body() body: LoginDto) {
    const result = await this.authService.login(body.username, body.password);
    return result;
  }

  // For frontend route-guard checks. Does NOT protect any other routes.
  @Get('validate')
  @ApiOperation({ summary: 'Validar token JWT' })
  @ApiQuery({ name: 'token', required: false, description: 'Alternativa al header Authorization' })
  async validate(
    @Headers('authorization') authorization?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const token = this.authService.extractToken(authorization) ?? tokenQuery;
    if (!token) {
      throw new UnauthorizedException('Token missing');
    }
    const payload = this.authService.validateToken(token);
    return {
      valid: true,
      user: { username: payload.username, name: payload.name },
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
