import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Area } from '../area/area.entity';

@Entity('produccion_diaria')
@Index(['fecha', 'areaId'], { unique: true })
export class ProduccionDiaria {
  @PrimaryColumn({ type: 'date' })
  fecha: Date;

  @PrimaryColumn('uuid')
  areaId: string;

  @ManyToOne(() => Area, { nullable: false })
  @JoinColumn({ name: 'areaId' })
  area: Area;

  @Column('int', { default: 0 })
  piezas: number;

  @Column('int', { default: 0 })
  pedaleadas: number;

  @Column('int', { default: 0 })
  sesionesCerradas: number;
}
