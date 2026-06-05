import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { AuthUser } from './user.entity'

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(AuthUser),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  });

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
});
