import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity, ManyToMany, JoinTable } from 'typeorm';
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

  @ManyToMany(() => PasoProduccion)
  @JoinTable({
    name: 'sesion_trabajo_pasos',
    joinColumn: { name: 'sesionTrabajoId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'pasosOrdenId', referencedColumnName: 'id' },
  })
  pasosOrden: PasoProduccion[];

  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaFin: Date;

  @Column({ type: 'enum', enum: EstadoSesionTrabajo, default: EstadoSesionTrabajo.ACTIVA })
  estado: EstadoSesionTrabajo;
}
