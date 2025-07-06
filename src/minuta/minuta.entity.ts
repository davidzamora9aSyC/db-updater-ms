import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Minuta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recursoId: string;

  @Column()
  ordenId: string;

  @Column()
  pasoId: string;

  @Column()
  cantidad: number;

  @Column()
  pedalazos: number;

  @Column({ nullable: true })
  observaciones?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}