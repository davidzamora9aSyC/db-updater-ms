import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class PasoProduccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  ordenProduccionId: string;

  @Column()
  numeroPaso: number;

  @Column({ default: 'pendiente' })
  estado: 'pendiente' | 'en_progreso' | 'completado';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}