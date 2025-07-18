import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { Recurso } from '../recurso/recurso.entity';

export enum TipoEstadoRecurso {
  DESCANSO = 'descanso',
  MANTENIMIENTO = 'mantenimiento',
  PRODUCCION = 'produccion',
}

@Entity('estado_recurso')
export class EstadoRecurso extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Recurso, { nullable: false })
  @JoinColumn({ name: 'recursoId' })
  recurso: Recurso;

  @Column({ type: 'enum', enum: TipoEstadoRecurso })
  estado: TipoEstadoRecurso;

  @Column({ type: 'timestamp' })
  inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin: Date;
}
