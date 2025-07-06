import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity } from 'typeorm'

@Entity('registro_minuto')
export class RegistroMinuto extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  recursoId: string

  @Column()
  ordenId: string

  @Column()
  pasoId: string

  @Column('int')
  cantidad: number

  @Column('int')
  pedalazos: number

  @CreateDateColumn()
  timestamp: Date
}