import { TableColumn } from './entities/column.entity';
import { UserTableView } from './entities/table-view.entity';

export const formatTableViewColumns = (view: UserTableView) => {
  const columns = view.columns.map((c) => ({
    id: c.column.id,
    key: c.column.key,
    name: c.column.name,
    data_type: c.column.data_type,
    is_sortable: c.column.is_sortable,
    width: c.width,
    pinned: c.pinned,
    order: c.order,
  }));

  return columns.sort((a, b) => a.order - b.order);
};

export const formatColumns = (columns: TableColumn[]) => {
  return columns.map((c) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    data_type: c.data_type,
    is_sortable: c.is_sortable,
  }));
};
