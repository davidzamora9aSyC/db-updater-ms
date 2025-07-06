import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class OrdenProduccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  codigo: string;

  @Column("simple-array")
  pasos: string[];

  @Column({ default: 0 })
  progreso: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}