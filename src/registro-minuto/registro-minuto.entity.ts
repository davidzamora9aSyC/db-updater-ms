import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm'
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity'
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity'

@Entity('registro_minuto')
export class RegistroMinuto extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => SesionTrabajo, { nullable: false })
  @JoinColumn({ name: 'sesionTrabajoId' })
  sesionTrabajo: SesionTrabajo

  @ManyToOne(() => SesionTrabajoPaso, { nullable: false })
  @JoinColumn({ name: 'pasoSesionTrabajoId' })
  pasoSesionTrabajo: SesionTrabajoPaso

  @Column({ type: 'timestamp' })
  minutoInicio: Date

  @Column('int')
  pedaleadas: number

  @Column('int')
  piezasContadas: number
}