import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionTrabajoService } from './sesion-trabajo.service';
import { SesionTrabajo } from './sesion-trabajo.entity';
import { RegistroMinutoService } from '../registro-minuto/registro-minuto.service';
import { EstadoSesionService } from '../estado-sesion/estado-sesion.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { EstadoSesion } from '../estado-sesion/estado-sesion.entity';
import { EstadoTrabajador } from '../estado-trabajador/estado-trabajador.entity';
import { EstadoMaquina } from '../estado-maquina/estado-maquina.entity';

describe('SesionTrabajoService', () => {
  let service: SesionTrabajoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SesionTrabajoService,
        { provide: getRepositoryToken(SesionTrabajo), useClass: Repository },
        { provide: getRepositoryToken(EstadoSesion), useClass: Repository },
        { provide: getRepositoryToken(EstadoTrabajador), useClass: Repository },
        { provide: getRepositoryToken(EstadoMaquina), useClass: Repository },
        { provide: RegistroMinutoService, useValue: {} },
        { provide: EstadoSesionService, useValue: {} },
        { provide: ConfiguracionService, useValue: {} },
      ],
    }).compile();

    service = module.get<SesionTrabajoService>(SesionTrabajoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
