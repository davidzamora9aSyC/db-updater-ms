import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity, Index } from 'typeorm';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';

export enum TipoEstadoSesion {
  PRODUCCION = 'produccion',
  INACTIVO = 'inactivo',
  OTRO = 'otro',
}

@Entity('estado_sesion')
export class EstadoSesion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => SesionTrabajo, { nullable: false })
  @JoinColumn({ name: 'sesionTrabajoId' })
  sesionTrabajo: SesionTrabajo;

  @Column({ type: 'enum', enum: TipoEstadoSesion })
  estado: TipoEstadoSesion;

  @Column({ type: 'timestamp' })
  inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin: Date | null;
}
