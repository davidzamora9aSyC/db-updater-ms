import { Test, TestingModule } from '@nestjs/testing';
import { SesionTrabajoController } from './sesion-trabajo.controller';
import { SesionTrabajoService } from './sesion-trabajo.service';

describe('SesionTrabajoController', () => {
  let controller: SesionTrabajoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SesionTrabajoController],
      providers: [{ provide: SesionTrabajoService, useValue: {} }],
    }).compile();

    controller = module.get<SesionTrabajoController>(SesionTrabajoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
