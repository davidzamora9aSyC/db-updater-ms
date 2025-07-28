import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';

export enum TipoEstadoSesion {
  DESCANSO = 'descanso',
  MANTENIMIENTO = 'mantenimiento',
  PRODUCCION = 'produccion',
}

@Entity('estado_sesion')
export class EstadoSesion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SesionTrabajo, { nullable: false })
  @JoinColumn({ name: 'sesionTrabajoId' })
  sesionTrabajo: SesionTrabajo;

  @Column({ type: 'enum', enum: TipoEstadoSesion })
  estado: TipoEstadoSesion;

  @Column({ type: 'timestamp' })
  inicio: Date;
}
