import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';

@Entity('indicador_sesion')
export class IndicadorSesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SesionTrabajo, { nullable: false })
  @JoinColumn({ name: 'sesionTrabajoId' })
  sesionTrabajo: SesionTrabajo;

  @Column()
  areaIdSnapshot: string;

  @Column()
  trabajadorId: string;

  @Column()
  maquinaId: string;

  @Column()
  maquinaTipo: string;

  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp' })
  fechaFin: Date;

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
  velocidadMax10m: number;

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
  duracionSesionMin: number;

  @Column({ type: 'timestamp' })
  creadoEn: Date;
}
