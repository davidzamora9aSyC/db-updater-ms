import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm'

@Entity('trabajador')
export class Trabajador extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  nombre: string

  @Column({ unique: true })
  identificacion: string

  @Column({ default: true })
  estado: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}