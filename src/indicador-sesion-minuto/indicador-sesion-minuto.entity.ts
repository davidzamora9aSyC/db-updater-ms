import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';

@Entity('indicador_sesion_minuto')
@Index(['sesionTrabajo', 'minuto'])
export class IndicadorSesionMinuto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SesionTrabajo, { nullable: false })
  @JoinColumn({ name: 'sesionTrabajoId' })
  sesionTrabajo: SesionTrabajo;

  @Column({ type: 'timestamp' })
  minuto: Date;

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

  @Column('float')
  velocidadActual: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  nptMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
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
  duracionSesionMin: number;

  @Column({ type: 'timestamp' })
  actualizadoEn: Date;
}
