/**
 * How the filter dropdown options for a table-view column are loaded.
 *
 * Use with source_config to tell the ETL layer where to get the list of options.
 */
export enum ColumnSourceType {
  /**
   * Options are the values of a TypeScript enum (fixed list defined in code).
   * Use when the filter has a fixed set of values that never come from the DB.
   * Example: Status filter → source_config: { enumName: "QueueStatus" } → BOOKED, CALLED, COMPLETED, ...
   */
  ENUM = 'ENUM',

  /**
   * Options are rows from an entity table (e.g. all doctors, all patients).
   * Use when the filter is “pick one record” and you need id + label from the DB.
   * Example: Doctor filter → source_config: { entityName: "Doctor", valueField: "id", labelField: "user.name" } → list of doctors.
   */
  ENTITY = 'ENTITY',

  /**
   * Options are the distinct values of a single column on an entity (e.g. all dates that appear in Queue).
   * Use when the filter is “pick one value” and that value comes from existing data, not a reference table.
   * Example: Date filter → source_config: { entityName: "Queue", field: "appointmentDate" } → list of dates that have queues.
   */
  DISTINCT_FIELD = 'DISTINCT_FIELD',
}
