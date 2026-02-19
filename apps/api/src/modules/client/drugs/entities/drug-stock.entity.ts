import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { DrugStockType } from '@repo/store';
import { DrugInventory } from './drug-inventory.entity';

/** Schema-based entity: lives in tenant schema. */
@Entity('drug_stocks')
export class DrugStock extends BaseEntity {
  @Column({ type: 'uuid' })
  drug_inventory_id: string;

  @OneToOne(() => DrugInventory, (drugInventory) => drugInventory.id)
  @JoinColumn({ name: 'drug_inventory_id' })
  drug_inventory: DrugInventory;

  @Column({ type: 'enum', enum: DrugStockType })
  type: DrugStockType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;
}
