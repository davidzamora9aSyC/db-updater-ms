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
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Public } from './public.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
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
    try {
      const result = await this.authService.login(body.username, body.password)
      return result
    } catch (err: any) {
      // Log without leaking password
      console.error('[auth/login] error', {
        username: body?.username,
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
      })
      throw err
    }
  }

  // For frontend route-guard checks. Does NOT protect any other routes.
  @Public()
  @Get('validate')
  @ApiOperation({ summary: 'Validar token JWT' })
  @ApiQuery({ name: 'token', required: false, description: 'Alternativa al header Authorization' })
  async validate(
    @Headers('authorization') authorization?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const token = this.authService.extractToken(authorization) ?? tokenQuery
    if (!token) {
      return { valid: false }
    }
    const payload = this.authService.validateToken(token)
    return {
      valid: true,
      user: { username: payload.username, name: payload.name },
      iat: payload.iat,
      exp: payload.exp,
    }
  }
}
