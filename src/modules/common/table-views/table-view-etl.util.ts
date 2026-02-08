import { ColumnDataType } from './entities/column.entity';

/** Shape needed for ETL extraction (from TableColumn or view column). */
export interface TableColumnSourceConfig {
  key: string;
  data_type: ColumnDataType | string;
  source_config: Record<string, unknown> | null;
}

/**
 * Extract: get raw value from entity using column's source_config (no hardcoded keys).
 * - source_config.field (e.g. "doctor.user.name", "appointmentDate") → value at that path
 * - source_config.enumName only (e.g. QueueStatus) → entity[column.key]
 * - fallback → entity[column.key]
 */
export function extractCellValue(
  entity: object,
  column: TableColumnSourceConfig,
): unknown {
  const config = column.source_config;
  if (config && typeof config.field === 'string') {
    return getValueByPath(entity, config.field);
  }
  const key = column.key;
  if (key in entity) {
    return (entity as Record<string, unknown>)[key];
  }
  return undefined;
}

/**
 * Get a nested value by dot path, e.g. "doctor.user.name" → entity.doctor?.user?.name
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  if (obj == null || path === '') return undefined;
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Transform: format raw value for display based on column data_type.
 */
export function transformCellValue(
  raw: unknown,
  dataType: ColumnDataType | string,
): string | number | null {
  if (raw == null) return null;
  switch (dataType) {
    case ColumnDataType.DATE:
    case ColumnDataType.TIME:
    case ColumnDataType.DATETIME:
      return raw instanceof Date ? raw.toISOString() : String(raw);
    default:
      return String(raw);
  }
}

/**
 * ETL: extract from entity using column config, then transform for display.
 */
export function getCellValue(
  entity: object,
  column: TableColumnSourceConfig,
): string | number | null {
  const raw = extractCellValue(entity, column);
  return transformCellValue(raw, column.data_type);
}
