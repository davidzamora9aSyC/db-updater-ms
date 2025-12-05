import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  Column,
  Index,
} from 'typeorm';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { PasoProduccion } from '../paso-produccion/paso-produccion.entity';
import { FuenteDatosSesion } from '../sesion-trabajo/sesion-trabajo.entity';

@Entity('sesion_trabajo_paso')
export class SesionTrabajoPaso extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index() 
  @ManyToOne(() => SesionTrabajo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sesionTrabajoId' })
  sesionTrabajo: SesionTrabajo;

  @Index()
  @ManyToOne(() => PasoProduccion, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pasoOrdenId' })
  pasoOrden: PasoProduccion;

  @Column('int', { default: 0 })
  cantidadAsignada: number;

  @Column('int', { default: 0 })
  cantidadProducida: number;

  @Column('int', { default: 0 })
  cantidadPedaleos: number;

  @Column({ type: 'enum', enum: FuenteDatosSesion, nullable: true })
  fuente: FuenteDatosSesion | null;

  @Column({ type: 'boolean', default: false })
  finalizado: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  finalizadoEn: Date | null;

}
