import { ColumnDataType } from '../entities/column.entity';

export const QUEUE_DEFAULT_CONFIG = {
  columns: [
    {
      key: 'aid',
      name: 'AID',
      data_type: ColumnDataType.STRING,
      source_config: { entityName: 'Queue', field: 'aid' },
    },
    {
      key: 'status',
      name: 'Status',
      data_type: ColumnDataType.STRING,
      source_config: { enumName: 'QueueStatus' },
    },
  ],
};
