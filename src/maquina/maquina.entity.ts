export enum TipoMaquina {
  TROQUELADORA = 'troqueladora',
  TALADRO = 'taladro',
  HORNO = 'horno',
  VULCANIZADORA = 'vulcanizadora',
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,

} from 'typeorm';
import { Area } from '../area/area.entity';

@Entity()
export class Maquina {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ default: '' })
  codigo: string;

  @Column({ length: 100, nullable: true })
  ubicacion: string;

  @Column({ nullable: true })
  fechaInstalacion: string;

  @Column({ type: 'enum', enum: TipoMaquina, nullable: true })
  tipo: TipoMaquina;

  @Column({ length: 255, nullable: true })
  observaciones: string;

  @ManyToOne(() => Area, { nullable: false })
  @JoinColumn({ name: 'areaId' })
  @Index()
  area: Area;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
