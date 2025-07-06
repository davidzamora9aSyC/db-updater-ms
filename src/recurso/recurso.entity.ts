import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm'
import { Trabajador } from '../trabajador/trabajador.entity'
import { Maquina } from '../maquina/maquina.entity'

@Entity('recurso')
export class Recurso extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Trabajador, { nullable: false })
  @JoinColumn({ name: 'trabajadorId' })
  trabajador: Trabajador

  @ManyToOne(() => Maquina, { nullable: false })
  @JoinColumn({ name: 'maquinaId' })
  maquina: Maquina

  @Column({ default: true })
  activo: boolean
}