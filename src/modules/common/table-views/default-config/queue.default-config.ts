import { ColumnDataType } from '../entities/column.entity';
import { ColumnSourceType } from '../enums/column-source-type.enum';

export const QUEUE_DEFAULT_CONFIG = {
  columns: [
    {
      key: 'aid',
      name: 'AID',
      data_type: ColumnDataType.STRING,
      source_type: ColumnSourceType.DISTINCT_FIELD,
      source_config: { entityName: 'Queue', field: 'aid' },
    },
    {
      key: 'status',
      name: 'Status',
      data_type: ColumnDataType.STRING,
      source_type: ColumnSourceType.ENUM,
      source_config: { enumName: 'QueueStatus' },
    },
  ],
};
