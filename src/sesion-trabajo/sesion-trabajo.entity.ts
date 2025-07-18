import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { Recurso } from '../recurso/recurso.entity';
import { PasoProduccion } from '../paso-produccion/paso-produccion.entity';

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

  @ManyToOne(() => PasoProduccion, { nullable: false })
  @JoinColumn({ name: 'pasoOrdenId' })
  pasoOrden: PasoProduccion;

  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaFin: Date;

  @Column({ type: 'enum', enum: EstadoSesionTrabajo, default: EstadoSesionTrabajo.ACTIVA })
  estado: EstadoSesionTrabajo;
}
