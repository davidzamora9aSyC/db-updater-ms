import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export enum AlertaTipoCodigo {
  TRABAJADOR_DEMASIADOS_DESCANSOS_EN_DIA = 'TRABAJADOR_DEMASIADOS_DESCANSOS_EN_DIA',
  TRABAJADOR_PAUSA_LARGA = 'TRABAJADOR_PAUSA_LARGA',
  SESION_ABIERTA_PROLONGADA = 'SESION_ABIERTA_PROLONGADA',
  SIN_ACTIVIDAD = 'SIN_ACTIVIDAD',
}

@Entity('alerta_tipo')
@Unique(['codigo'])
export class AlertaTipo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AlertaTipoCodigo })
  codigo: AlertaTipoCodigo;

  @Column()
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;
}
