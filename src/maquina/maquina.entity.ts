export enum EstadoMaquina {
  ACTIVA = 'activa',
  NO_ACTIVA = 'no activa'
}

export enum TipoMaquina {
  TROQUELADORA = 'troqueladora',
  TALADRO = 'taladro',
  HORNO = 'horno',
  VULCANIZADORA = 'vulcanizadora'
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Maquina {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ length: 100 })
  ubicacion: string;

  @Column()
  fechaInstalacion: string;

  @Column({ type: 'enum', enum: TipoMaquina })
  tipo: TipoMaquina;

  @Column({ type: 'enum', enum: EstadoMaquina, default: EstadoMaquina.ACTIVA })
  estado: EstadoMaquina;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}