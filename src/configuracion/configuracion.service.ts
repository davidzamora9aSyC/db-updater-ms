import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from './configuracion.entity';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';

@Injectable()
export class ConfiguracionService {
  private cache: Configuracion | null = null;
  constructor(
    @InjectRepository(Configuracion)
    private readonly repo: Repository<Configuracion>,
  ) {}

  async getConfig(): Promise<Configuracion> {
    if (this.cache) return this.cache;
    let config = await this.repo.findOne({ where: {} });
    if (!config) {
      config = this.repo.create();
      await this.repo.save(config);
    }
    this.cache = config;
    return config;
  }

  async update(dto: UpdateConfiguracionDto) {
    const config = await this.getConfig();
    Object.assign(config, dto);
    await this.repo.save(config);
    this.cache = config;
    return config;
  }

  async getMinInactividad(): Promise<number> {
    const config = await this.getConfig();
    return config.minutosInactividadParaNPT;
  }

  async getZonaHoraria(): Promise<string> {
    const config = await this.getConfig();
    return config.zonaHorariaCliente;
  }

  async getMaxDescansosDiariosPorTrabajador(): Promise<number> {
    const config = await this.getConfig();
    return config.maxDescansosDiariosPorTrabajador;
  }

  async getMaxDuracionPausaMinutos(): Promise<number> {
    const config = await this.getConfig();
    return config.maxDuracionPausaMinutos;
  }

  async getMaxHorasSesionAbierta(): Promise<number> {
    const config = await this.getConfig();
    return config.maxHorasSesionAbierta;
  }
}
