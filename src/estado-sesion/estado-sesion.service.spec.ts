import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EstadoSesionService } from './estado-sesion.service';
import { EstadoSesion } from './estado-sesion.entity';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { BadRequestException } from '@nestjs/common';

describe('EstadoSesionService', () => {
  let service: EstadoSesionService;
  let repo: Repository<EstadoSesion>;
  let sesionRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadoSesionService,
        { provide: getRepositoryToken(EstadoSesion), useClass: Repository },
      ],
    }).compile();

    service = module.get<EstadoSesionService>(EstadoSesionService);
    repo = module.get<Repository<EstadoSesion>>(
      getRepositoryToken(EstadoSesion),
    );
    sesionRepo = { findOne: jest.fn() };
    (
      repo as unknown as { manager: { getRepository: () => typeof sesionRepo } }
    ).manager = {
      getRepository: () => sesionRepo,
    };
  });

  it('should reject creating state for finished session', async () => {
    sesionRepo.findOne.mockResolvedValue({
      id: '1',
      fechaFin: new Date(),
    } as Partial<SesionTrabajo>);

    await expect(
      service.create({
        sesionTrabajo: '1',
        estado: 0 as any,
        inicio: new Date(),
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should query only active states', async () => {
    const findSpy = jest.spyOn(repo, 'find').mockResolvedValue([] as any);
    await service.findBySesion('1');
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sesionTrabajo: { id: '1', fechaFin: IsNull() },
          fin: IsNull(),
        },
      }),
    );
  });
});
