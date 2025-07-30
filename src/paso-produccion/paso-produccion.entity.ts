import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdenProduccion } from '../orden-produccion/entity';

export enum EstadoPasoOrden {
  PENDIENTE = 'pendiente',
  ACTIVO = 'activo',
  PAUSADO = 'pausado',
  FINALIZADO = 'finalizado',
}

@Entity()
export class PasoProduccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @ManyToOne(() => OrdenProduccion, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ordenId' })
  orden: OrdenProduccion;

  @Column()
  codigoInterno: string;

  @Column('int')
  cantidadRequerida: number;

  @Column('int')
  cantidadProducida: number;

  @Column('int', { default: 0 })
  cantidadPedaleos: number;

  @Column({ type: 'enum', enum: EstadoPasoOrden, default: EstadoPasoOrden.PENDIENTE })
  estado: EstadoPasoOrden;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
