import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { SesionTrabajo } from './sesion-trabajo.entity';
import { RegistroMinutoService } from '../registro-minuto/registro-minuto.service';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { EstadoSesion, TipoEstadoSesion } from '../estado-sesion/estado-sesion.entity';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';
import { ProduccionDiariaService } from '../produccion-diaria/produccion-diaria.service';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';

describe('SesionTrabajoService', () => {
  let service: SesionTrabajoService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        SesionTrabajoService,
        { provide: getRepositoryToken(SesionTrabajo), useClass: Repository },
        { provide: getRepositoryToken(EstadoSesion), useClass: Repository },
        { provide: getRepositoryToken(EstadoTrabajador), useClass: Repository },
        { provide: getRepositoryToken(EstadoMaquina), useClass: Repository },
        { provide: getRepositoryToken(SesionTrabajoPaso), useClass: Repository },
        { provide: RegistroMinutoService, useValue: {} },
        { provide: EstadoSesionService, useValue: {} },
        { provide: ConfiguracionService, useValue: {} },
        {
          provide: ProduccionDiariaService,
          useValue: { actualizarProduccionPorSesionCerrada: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SesionTrabajoService>(SesionTrabajoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('incluye las relaciones sesion-trabajo-paso al buscar por id', async () => {
    const sesionRepo = module.get<Repository<SesionTrabajo>>(getRepositoryToken(SesionTrabajo));
    const estadoSesionRepo = module.get<Repository<EstadoSesion>>(getRepositoryToken(EstadoSesion));
    const stpRepo = module.get<Repository<SesionTrabajoPaso>>(getRepositoryToken(SesionTrabajoPaso));

    jest.spyOn(sesionRepo, 'findOne').mockResolvedValue({
      id: '1',
      trabajador: {},
      maquina: {},
    } as any);
    jest.spyOn(estadoSesionRepo, 'findOne').mockResolvedValue(null);
    const relaciones = [{ id: 'rel1' } as any];
    jest.spyOn(stpRepo, 'find').mockResolvedValue(relaciones);

    const result = await service.findOne('1');
    expect(result.sesionesTrabajoPaso).toEqual(
      relaciones.map((r) => ({ ...r, estado: TipoEstadoSesion.OTRO })),
    );
  });
});
