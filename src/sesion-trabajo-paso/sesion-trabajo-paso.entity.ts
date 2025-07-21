import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { SesionTrabajo } from '../sesion-trabajo/sesion-trabajo.entity';
import { PasoProduccion } from '../paso-produccion/paso-produccion.entity';

@Entity('sesion_trabajo_paso')
export class SesionTrabajoPaso extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SesionTrabajo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sesionTrabajoId' })
  sesionTrabajo: SesionTrabajo;

  @ManyToOne(() => PasoProduccion, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pasoOrdenId' })
  pasoOrden: PasoProduccion;
}
