import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Asignacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trabajadorId: string;

  @Column()
  maquinaId: string;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}