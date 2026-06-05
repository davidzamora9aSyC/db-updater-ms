import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuthUser } from './user.entity'

type JwtPayload = {
  sub: string;
  username: string;
  name?: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me'
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN || '8h'
  private readonly saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12)

  constructor(
    @InjectRepository(AuthUser)
    private readonly usersRepo: Repository<AuthUser>,
  ) {}

  async onModuleInit() {
    const username = process.env.ADMIN_USERNAME
    const password = process.env.ADMIN_PASSWORD
    if (!username || !password) return
    const existing = await this.usersRepo.findOne({ where: { username } })
    if (existing) return
    const passwordHash = await bcrypt.hash(password, this.saltRounds)
    const user = this.usersRepo.create({
      username,
      name: process.env.ADMIN_NAME || 'Administrador',
      passwordHash,
      isActive: true,
    })
    await this.usersRepo.save(user)
  }

  async login(username: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { username, isActive: true } })
    if (!user || !(await this.verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas')
    }
    const payload: JwtPayload = {
      sub: user.username,
      username: user.username,
      name: user.name,
    }
    const token = jwt.sign(
      payload,
      this.jwtSecret as jwt.Secret,
      { expiresIn: this.jwtExpiresIn as unknown as number | string } as jwt.SignOptions,
    ) as string
    const decoded = jwt.decode(token) as JwtPayload | null
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: typeof decoded?.exp === 'number' && typeof decoded?.iat === 'number' ? (decoded!.exp! - decoded!.iat!) : undefined,
      user: { username: user.username, name: user.name },
    }
  }

  validateToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload
    } catch (e) {
      throw new UnauthorizedException('Token inválido')
    }
  }

  extractToken(authorization?: string): string | undefined {
    if (!authorization) return undefined
    const parts = authorization.split(' ')
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1]
    return undefined
  }

  private async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }
}
