import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  Column,
} from 'typeorm';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { PasoProduccion } from '../paso-produccion/paso-produccion.entity';

export enum EstadoSesionTrabajoPaso {
  ACTIVO = 'activo',
  PAUSADO = 'en descanso',
  FINALIZADO = 'finalizado',
  PENDIENTE = 'pendiente',
}

@Entity('sesion_trabajo_paso')
export class SesionTrabajoPaso extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SesionTrabajo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sesionTrabajoId' })
  sesionTrabajo: SesionTrabajo;

  @ManyToOne(() => PasoProduccion, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pasoOrdenId' })
  pasoOrden: PasoProduccion;

  @Column('int', { default: 0 })
  cantidadAsignada: number;

  @Column('int', { default: 0 })
  cantidadProducida: number;

  @Column('int', { default: 0 })
  cantidadPedaleos: number;

  @Column({ default: 'Desconocido' })
  nombreTrabajador: string;

  @Column({ default: 'Desconocido' })
  nombreMaquina: string;

  @Column({
    type: 'enum',
    enum: EstadoSesionTrabajoPaso,
    default: EstadoSesionTrabajoPaso.ACTIVO,
  })
  estado: EstadoSesionTrabajoPaso;
}
