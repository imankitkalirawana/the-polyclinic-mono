import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, DeleteDateColumn, Entity, Index } from 'typeorm';

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

  @DeleteDateColumn()
  deletedAt?: Date;
}
