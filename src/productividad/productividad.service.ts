import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Productividad } from './productividad.entity'

@Injectable()
export class ProductividadService {
  private readonly repo

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Productividad)
  }

  async getMasProductivos(anio: number, mes: number) {
    return this.repo
      .createQueryBuilder('p')
      .select('p.trabajadorId', 'trabajadorId')
      .addSelect('SUM(p.cantidad)', 'total')
      .where('p.anio = :anio AND p.mes = :mes', { anio, mes })
      .groupBy('p.trabajadorId')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany()
  }

  async getResumenPorTrabajador(trabajadorId: string) {
    return this.repo.find({
      where: { trabajadorId },
      order: { fecha: 'DESC' },
      take: 30
    })
  }
}