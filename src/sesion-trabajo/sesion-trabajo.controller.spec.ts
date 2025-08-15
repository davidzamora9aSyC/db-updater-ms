import { Test, TestingModule } from '@nestjs/testing';
import { SesionTrabajoController } from './sesion-trabajo.controller';
import { SesionTrabajoService } from './sesion-trabajo.service';

describe('SesionTrabajoController', () => {
  let controller: SesionTrabajoController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SesionTrabajoController],
      providers: [
        {
          provide: SesionTrabajoService,
          useValue: {
            create: jest.fn(),
            findByMaquina: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SesionTrabajoController>(SesionTrabajoController);
    service = module.get<SesionTrabajoService>(SesionTrabajoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return id when esp32 flag is true on create', async () => {
    service.create.mockResolvedValue({ id: 'abc' });
    const result = await controller.create({} as any, 'true');
    expect(result).toBe('abc');
  });

  it('should return id when esp32 flag is true on findSesionActiva', async () => {
    service.findByMaquina.mockResolvedValue({ id: 'def' });
    const result = await controller.findSesionActiva('1', 'true');
    expect(result).toBe('def');
  });
});
