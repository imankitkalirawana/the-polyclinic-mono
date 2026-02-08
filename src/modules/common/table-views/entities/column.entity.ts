import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, DeleteDateColumn, Entity, Index } from 'typeorm';
import { ColumnSourceType } from '../enums/column-source-type.enum';
import { TableViewType } from '../enums/table-view-type.enum';

export enum ColumnDataType {
  STRING = 'STRING',
  INTEGER = 'INTEGER',
  HASHTAG = 'HASHTAG',
  DATE = 'DATE',
  TIME = 'TIME',
  DATETIME = 'DATETIME',
}
@Entity('table_columns', { schema: 'public' })
export class TableColumn extends BaseEntity {
  @Column({ unique: true })
  @Index()
  key: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ColumnDataType })
  data_type: ColumnDataType;

  @Column({ default: false })
  is_sortable: boolean;

  @Column({ type: 'enum', enum: ColumnSourceType, nullable: true })
  source_type: ColumnSourceType | null;

  @Column({ type: 'jsonb', nullable: true })
  source_config: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: TableViewType, nullable: true })
  view_type: TableViewType | null;

  @DeleteDateColumn()
  deletedAt?: Date;
}
