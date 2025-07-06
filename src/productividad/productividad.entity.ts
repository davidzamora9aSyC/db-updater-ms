import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm'

@Entity('productividad')
export class Productividad extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  trabajadorId: string

  @Column()
  recursoId: string

  @Column()
  pasoId: string

  @Column()
  ordenId: string

  @Column('int')
  cantidad: number

  @Column({ type: 'timestamp' })
  fecha: Date

  @Column('int')
  anio: number

  @Column('int')
  mes: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}