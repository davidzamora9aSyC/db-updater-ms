import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Boton {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tipo: string;

  @Column()
  recursoId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}