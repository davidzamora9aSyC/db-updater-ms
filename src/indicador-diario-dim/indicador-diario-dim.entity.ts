import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { FuenteDatosSesion } from '../sesion-trabajo/sesion-trabajo.entity';

@Entity('indicador_diario_dim')
export class IndicadorDiarioDim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'uuid', nullable: true })
  trabajadorId: string | null;

  @Column({ type: 'uuid', nullable: true })
  maquinaId: string | null;

  @Column({ type: 'uuid', nullable: true })
  areaId: string | null;

  @Column({ type: 'enum', enum: FuenteDatosSesion, nullable: true })
  fuente: FuenteDatosSesion | null;

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
