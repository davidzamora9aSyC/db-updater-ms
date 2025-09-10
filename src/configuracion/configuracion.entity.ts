import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('configuracion')
export class Configuracion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 3 })
  minutosInactividadParaNPT: number;

  @Column({ default: 'UTC' })
  zonaHorariaCliente: string;

  @Column({ type: 'int', default: 6 })
  maxDescansosDiariosPorTrabajador: number;

  @Column({ type: 'int', default: 30 })
  maxDuracionPausaMinutos: number;

  @Column({ type: 'int', default: 10 })
  maxHorasSesionAbierta: number;
}
