import { BaseEntity } from '@common/entity/base.entity';
import { Column, DeleteDateColumn, Entity, Index } from 'typeorm';
import { TableViewType } from '../enums/table-view-type.enum';

export enum ColumnDataType {
  STRING = 'STRING',
  INTEGER = 'INTEGER',
  DATE = 'DATE',
}

export enum ColumnType {
  DEFAULT = 'DEFAULT',
  CHIP = 'CHIP',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
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

  @Column({ type: 'enum', enum: ColumnType, default: ColumnType.DEFAULT })
  column_type: ColumnType;

  @Column({ default: false })
  is_sortable: boolean;

  @Column({ type: 'varchar', nullable: true })
  source: string;

  @Column({ type: 'enum', enum: TableViewType, nullable: true })
  view_type: TableViewType | null;

  @DeleteDateColumn()
  deletedAt?: Date;
}
