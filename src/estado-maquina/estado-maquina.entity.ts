import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity, Index } from 'typeorm';
import { Maquina } from '../maquina/maquina.entity';

@Entity('estado_maquina')
export class EstadoMaquina extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Maquina, { nullable: false })
  @JoinColumn({ name: 'maquinaId' })
  maquina: Maquina;

  @Column({ default: false })
  mantenimiento: boolean;

  @Column({ type: 'timestamp' })
  inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin: Date | null;
}
