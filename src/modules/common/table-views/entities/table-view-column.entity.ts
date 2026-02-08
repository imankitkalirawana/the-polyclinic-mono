import {
  Entity,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { UserTableView } from './table-view.entity';
import { TableColumn } from './column.entity';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('user_table_view_columns', { schema: 'public' })
@Index(['view_id', 'column_id'], { unique: true })
export class UserTableViewColumn extends BaseEntity {
  @ManyToOne(() => UserTableView, (v) => v.columns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'view_id' })
  view: UserTableView;

  @Column()
  view_id: string;

  @ManyToOne(() => TableColumn)
  @JoinColumn({ name: 'column_id' })
  column: TableColumn;

  @Column()
  column_id: string;

  @Column()
  order: number;

  @Column({ default: true })
  visible: boolean;

  @Column({ default: 160 })
  width: number;

  @Column({ default: false })
  pinned: boolean;

  @DeleteDateColumn()
  deletedAt?: Date;
}
