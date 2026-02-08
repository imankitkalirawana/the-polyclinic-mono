export interface TableViewColumnConfig {
  key: string;
  name: string;
  data_type: string;
  is_sortable: boolean;
  order: number;
  visible: boolean;
  width: number;
  pinned: boolean;
}

export interface TableViewResult {
  columns: TableViewColumnConfig[];
  filters: Record<string, unknown>;
}
