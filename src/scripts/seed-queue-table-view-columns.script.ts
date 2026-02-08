import { executeScript } from './script-runner.util';
import { INestApplicationContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  TableColumn,
  ColumnDataType,
} from '../modules/common/table-views/entities/column.entity';
import { UserTableView } from '../modules/common/table-views/entities/table-view.entity';
import { UserTableViewColumn } from '../modules/common/table-views/entities/table-view-column.entity';
import { ColumnSourceType } from '../modules/common/table-views/enums/column-source-type.enum';
import { TableViewType } from '../modules/common/table-views/enums/table-view-type.enum';

const QUEUE_FILTER_COLUMN_DEFS = [
  {
    key: 'status',
    name: 'Status',
    data_type: ColumnDataType.STRING,
    source_type: ColumnSourceType.ENUM,
    source_config: { enumName: 'QueueStatus' },
  },
  {
    key: 'doctorId',
    name: 'Doctor',
    data_type: ColumnDataType.STRING,
    source_type: ColumnSourceType.ENTITY,
    source_config: {
      entityName: 'Doctor',
      valueField: 'id',
      labelField: 'user.name',
    },
  },
  {
    key: 'appointmentDate',
    name: 'Date',
    data_type: ColumnDataType.DATE,
    source_type: ColumnSourceType.DISTINCT_FIELD,
    source_config: { entityName: 'Queue', field: 'appointmentDate' },
  },
] as const;

async function run(app: INestApplicationContext) {
  const dataSource = app.get(DataSource);
  const tableColumnRepo = dataSource.getRepository(TableColumn);
  const userTableViewRepo = dataSource.getRepository(UserTableView);
  const viewColumnRepo = dataSource.getRepository(UserTableViewColumn);

  // 1) Ensure table_columns has queue filter rows (view_type = QUEUE)
  let queueColumns = await tableColumnRepo.find({
    where: { view_type: TableViewType.QUEUE },
    order: { key: 'ASC' },
  });

  for (const def of QUEUE_FILTER_COLUMN_DEFS) {
    const existing = queueColumns.find((c) => c.key === def.key);
    if (!existing) {
      const col = tableColumnRepo.create({
        key: def.key,
        name: def.name,
        data_type: def.data_type,
        is_sortable: false,
        source_type: def.source_type,
        source_config: def.source_config,
        view_type: TableViewType.QUEUE,
      });
      await tableColumnRepo.save(col);
      queueColumns = await tableColumnRepo.find({
        where: { view_type: TableViewType.QUEUE },
        order: { key: 'ASC' },
      });
    }
  }

  queueColumns = await tableColumnRepo.find({
    where: { view_type: TableViewType.QUEUE },
    order: { key: 'ASC' },
  });

  if (queueColumns.length === 0) {
    console.log('No queue filter columns in table_columns. Exiting.');
    return;
  }

  // 2) For each QUEUE view with no columns, attach the queue filter columns
  const queueViews = await userTableViewRepo.find({
    where: { type: TableViewType.QUEUE },
    relations: { columns: true },
  });

  let attached = 0;
  for (const view of queueViews) {
    const existingCount = view.columns?.length ?? 0;
    if (existingCount > 0) continue;

    for (let i = 0; i < queueColumns.length; i++) {
      const vc = viewColumnRepo.create({
        view_id: view.id,
        column_id: queueColumns[i].id,
        order: i,
        visible: true,
        width: 160,
        pinned: false,
      });
      await viewColumnRepo.save(vc);
      attached++;
    }
  }

  console.log(
    `Queue table-view columns: ${queueColumns.length} table_columns, ${queueViews.length} QUEUE views; attached ${attached} user_table_view_columns.`,
  );
}

executeScript(run);
