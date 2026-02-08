import { User } from '@/auth/entities/user.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { UserTableViewColumn } from './table-view-column.entity';
import { BaseEntity } from 'src/common/entity/base.entity';
import { TableViewType } from '../enums/table-view-type.enum';
import { QueueStatus } from '@/client/appointments/queue/entities/queue.entity';

export { TableViewType };

export type TableViewFilters = {
  status?: QueueStatus;
};

@Entity('user_table_views', { schema: 'public' })
export class UserTableView extends BaseEntity {
  @Column({ default: 'Default View' })
  name: string;

  @Column({ type: 'enum', enum: TableViewType })
  type: TableViewType;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => UserTableViewColumn, (vc) => vc.view, {
    cascade: true,
  })
  columns: UserTableViewColumn[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  filters: TableViewFilters;

  @DeleteDateColumn()
  deletedAt?: Date;
}
