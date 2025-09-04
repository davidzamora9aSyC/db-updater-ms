import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { USERS } from './users.config';

type JwtPayload = {
  sub: string;
  username: string;
  name?: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN || '8h';

  login(username: string, password: string) {
    const user = USERS.find((u) => u.username === username);
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload: JwtPayload = {
      sub: user.username,
      username: user.username,
      name: user.name,
    };
    const token = jwt.sign(
      payload,
      this.jwtSecret as jwt.Secret,
      { expiresIn: this.jwtExpiresIn as unknown as number | string } as jwt.SignOptions,
    ) as string;
    const decoded = jwt.decode(token) as JwtPayload | null;
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: typeof decoded?.exp === 'number' && typeof decoded?.iat === 'number' ? (decoded!.exp! - decoded!.iat!) : undefined,
      user: { username: user.username, name: user.name },
    };
  }

  validateToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch (e) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  extractToken(authorization?: string): string | undefined {
    if (!authorization) return undefined;
    const parts = authorization.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
    return undefined;
  }

  private verifyPassword(plain: string, hash: string): boolean {
    // Passwords hashed with built-in crypto SHA256 (salted with username for simplicity)
    const [algo, username, digest] = hash.split(':');
    if (algo !== 'sha256' || !username || !digest) return false;
    const computed = this.sha256(`${username}:${plain}`);
    return computed === digest;
  }

  private sha256(input: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
