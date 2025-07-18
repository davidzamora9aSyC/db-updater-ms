import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrdenProduccion } from '../orden-produccion/entity';

@Entity('material_orden')
export class MaterialOrden {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrdenProduccion, { nullable: false })
  @JoinColumn({ name: 'ordenId' })
  orden: OrdenProduccion;

  @Column()
  codigo: string;

  @Column()
  descripcion: string;

  @Column()
  unidad: string;

  @Column('int')
  cantidad: number;
}
