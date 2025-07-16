import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm'
import { EstadoTrabajador, GrupoTrabajador, TurnoTrabajador } from '../trabajador/dto/update-trabajador.dto'

@Entity('trabajador')
export class Trabajador extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  nombre: string

  @Column({ unique: true })
  identificacion: string

  @Column({ type: 'enum', enum: EstadoTrabajador, default: EstadoTrabajador.CREADO })
  estado: EstadoTrabajador

  @Column({ type: 'enum', enum: GrupoTrabajador })
  grupo: GrupoTrabajador

  @Column({ type: 'enum', enum: TurnoTrabajador })
  turno: TurnoTrabajador

  @Column({ type: 'date' })
  fechaInicio: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}