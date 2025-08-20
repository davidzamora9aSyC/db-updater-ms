import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('indicador_diario_dim')
export class IndicadorDiarioDim {
  @PrimaryColumn({ type: 'date' })
  fecha: string;

  @Column({ type: 'uuid', primary: true, nullable: true })
  trabajadorId: string | null;

  @Column({ type: 'uuid', primary: true, nullable: true })
  maquinaId: string | null;

  @Column({ type: 'uuid', primary: true, nullable: true })
  areaId: string | null;

  @Column('int')
  produccionTotal: number;

  @Column('int')
  defectos: number;

  @Column('float')
  porcentajeDefectos: number;

  @Column('float')
  avgSpeed: number;

  @Column('float')
  avgSpeedSesion: number;

  @Column('int')
  nptMin: number;

  @Column('int')
  nptPorInactividad: number;

  @Column('float')
  porcentajeNPT: number;

  @Column('int')
  pausasCount: number;

  @Column('int')
  pausasMin: number;

  @Column('float')
  porcentajePausa: number;

  @Column('int')
  duracionTotalMin: number;

  @Column('int')
  sesionesCerradas: number;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
