export interface TableViewColumnConfig {
  key: string;
  name: string;
  data_type: string;
  order: number;
  width: number;
  pinned: boolean;
}

export interface TableViewResult {
  columns: TableViewColumnConfig[];
  filters: Record<string, unknown>;
}

/** Option for filter dropdowns (value + label) */
export interface FilterOption<T = string | number> {
  value: T;
  label: string;
}

/** Cell value: at least `value`; add more keys (e.g. label, meta) as needed. */
export interface TableViewCell {
  value: string | number | null;
  [key: string]: unknown;
}
