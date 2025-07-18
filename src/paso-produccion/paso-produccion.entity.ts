import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OrdenProduccion } from '../orden-produccion/entity';

@Entity()
export class PasoProduccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @ManyToOne(() => OrdenProduccion, { nullable: false })
  @JoinColumn({ name: 'ordenId' })
  orden: OrdenProduccion;

  @Column()
  codigoInterno: string;

  @Column('int')
  cantidadRequerida: number;

  @Column('int')
  cantidadProducida: number;

  @Column({ default: 'pendiente' })
  estado: 'pendiente' | 'en_progreso' | 'completado';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}