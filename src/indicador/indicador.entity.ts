import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Indicador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recursoId: string;

  @Column()
  piezas: number;

  @Column()
  pedalazos: number;

  @Column()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}