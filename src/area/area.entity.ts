import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('area')
export class Area {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;
}
