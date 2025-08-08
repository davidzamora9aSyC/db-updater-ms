import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, BaseEntity, Index } from 'typeorm';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';

@Entity('pausa_paso_sesion')
@Index('uq_pausa_abierta_por_paso', ['pasoSesion'], { unique: true, where: 'fin IS NULL' })
export class PausaPasoSesion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => SesionTrabajoPaso, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pasoSesionId' })
  pasoSesion: SesionTrabajoPaso;

  @Column({ type: 'timestamp' })
  inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin: Date | null;

  @Column({ type: 'uuid', nullable: true })
  maquinaId: string | null;

  @Column({ type: 'uuid', nullable: true })
  trabajadorId: string | null;
}
