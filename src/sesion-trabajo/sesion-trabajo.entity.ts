import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { Trabajador } from '../trabajador/trabajador.entity';
import { Maquina } from '../maquina/maquina.entity';

@Entity('sesion_trabajo')
export class SesionTrabajo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trabajador, { nullable: false })
  @JoinColumn({ name: 'trabajadorId' })
  trabajador: Trabajador;

  @ManyToOne(() => Maquina, { nullable: false })
  @JoinColumn({ name: 'maquinaId' })
  maquina: Maquina;

  @Column({ type: 'uuid', nullable: true })
  areaIdSnapshot: string | null;

  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaFin: Date | null;

  @Column('int', { default: 0 })
  cantidadProducida: number;

  @Column('int', { default: 0 })
  cantidadPedaleos: number;

  @Column({ default: false })
  agregadoEnProduccion: boolean;
}
