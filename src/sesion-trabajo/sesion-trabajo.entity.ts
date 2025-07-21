import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { Recurso } from '../recurso/recurso.entity';

export enum EstadoSesionTrabajo {
  ACTIVA = 'activa',
  FINALIZADA = 'finalizada',
}

@Entity('sesion_trabajo')
export class SesionTrabajo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Recurso, { nullable: false })
  @JoinColumn({ name: 'recursoId' })
  recurso: Recurso;
  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaFin: Date;

  @Column({ type: 'enum', enum: EstadoSesionTrabajo, default: EstadoSesionTrabajo.ACTIVA })
  estado: EstadoSesionTrabajo;
}
