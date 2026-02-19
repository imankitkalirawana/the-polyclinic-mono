import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Drug } from '@common/drugs/entities/drug.entity';

/** Schema-based entity: lives in tenant schema, references public Drug. */
@Entity('drug_inventories')
export class DrugInventory extends BaseEntity {
  @Column({ type: 'uuid' })
  drug_id: string;

  @OneToOne(() => Drug, (drug) => drug.id, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'drug_id' })
  drug: Drug;

  @Column({ type: 'varchar', length: 255 })
  batch_number: string;

  @Column({ type: 'date' })
  expiry_date: Date;

  @Column({ type: 'int' })
  quantity_received: number;

  @Column({ type: 'int' })
  quantity_available: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  purchase_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  selling_price: number;
}
