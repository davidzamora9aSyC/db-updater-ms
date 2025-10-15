import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EstadoOrdenProduccion {
  PENDIENTE = 'pendiente',
  ACTIVA = 'activa',
  PAUSADA = 'pausada',
  FINALIZADA = 'finalizada',
}

@Entity()
export class OrdenProduccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: string;

  @Index('idx_orden_producto')
  @Column()
  producto: string;

  @Column('int')
  cantidadAProducir: number;

  @Column({ type: 'date' })
  fechaOrden: Date;

  @Column({ type: 'date' })
  fechaVencimiento: Date;

  @Column({
    type: 'enum',
    enum: EstadoOrdenProduccion,
    default: EstadoOrdenProduccion.PENDIENTE,
  })
  estado: EstadoOrdenProduccion;

 

}
