import { DrugForm, DrugScheduleType } from '@repo/store';
import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

/** Public schema entity: shared across all tenants. */
@Entity('drug_drugs', { schema: 'public' })
export class Drug extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  generic_name: string;

  @Column({ nullable: true })
  strength: string;

  @Column({ type: 'enum', enum: DrugForm })
  form: DrugForm;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ type: 'enum', enum: DrugScheduleType })
  schedule_type: DrugScheduleType;

  @Column('text', {
    array: true,
    default: () => 'ARRAY[]::text[]',
    nullable: true,
  })
  companies: string[];
}
