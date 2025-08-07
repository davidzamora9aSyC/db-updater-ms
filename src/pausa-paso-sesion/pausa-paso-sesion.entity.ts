import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, BaseEntity, Index } from 'typeorm';
import { SesionTrabajoPaso } from '../sesion-trabajo-paso/sesion-trabajo-paso.entity';

@Entity('pausa_paso_sesion')
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
}
