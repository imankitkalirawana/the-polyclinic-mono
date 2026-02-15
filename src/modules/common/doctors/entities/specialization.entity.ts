import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base.entity';
import { Doctor } from './doctor.entity';

@Entity('doctor_specializations', { schema: 'public' })
export class Specialization extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Doctor, (doctor) => doctor.specializations)
  doctors: Doctor[];
}
