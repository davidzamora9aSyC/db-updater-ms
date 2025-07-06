import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export type EventoTipo = 'PEDAL' | 'TOLVA' | 'INICIO_RECURSO' | 'INICIO_ORDEN'

@Entity()
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  recursoId: string

  @Column({ type: 'enum', enum: ['PEDAL', 'TOLVA', 'INICIO_RECURSO', 'INICIO_ORDEN'] })
  tipo: EventoTipo

  @Column({ nullable: true })
  ordenId?: string

  @Column({ nullable: true })
  pasoId?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}