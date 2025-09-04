import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const result = await this.authService.login(body.username, body.password);
    return result;
  }

  // For frontend route-guard checks. Does NOT protect any other routes.
  @Get('validate')
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
