import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AlertaTipo } from './alerta-tipo.entity';

export enum AlertaSujetoTipo {
  TRABAJADOR = 'TRABAJADOR',
  MAQUINA = 'MAQUINA',
  AREA = 'AREA',
  ORDEN = 'ORDEN',
}

@Entity('alerta')
export class Alerta extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AlertaTipo, { nullable: false, eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tipoId' })
  tipo: AlertaTipo;

  @Column({ type: 'enum', enum: AlertaSujetoTipo })
  sujetoTipo: AlertaSujetoTipo;

  @Index()
  @Column({ type: 'uuid' })
  sujetoId: string;

  // Fecha relevante de la alerta (p.ej. dia)
  @Column({ type: 'date' })
  fecha: string;

  // Datos adicionales (p.ej. conteos, valores medidos)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}

