import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity, Index } from 'typeorm';
import { Trabajador } from '../trabajador/trabajador.entity';

@Entity('estado_trabajador')
export class EstadoTrabajador extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Index()
  @ManyToOne(() => Trabajador, { nullable: false })
  @JoinColumn({ name: 'trabajadorId' })
  trabajador: Trabajador;

  @Column({ default: false })
  descanso: boolean;

  @Column({ type: 'timestamp' })
  inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin: Date | null;
}
