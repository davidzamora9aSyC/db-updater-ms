import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class OrdenProduccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: string;

  @Column()
  producto: string;

  @Column('int')
  cantidadAProducir: number;

  @Column({ type: 'date' })
  fechaOrden: string;

  @Column({ type: 'date' })
  fechaVencimiento: string;

  @Column()
  estado: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
