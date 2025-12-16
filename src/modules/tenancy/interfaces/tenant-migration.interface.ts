import { DataSource } from 'typeorm';

export interface TenantMigration {
  /**
   * Migration timestamp/version identifier
   * Format: YYYYMMDDHHMMSS (e.g., 20240101120000)
   */
  version: string;

  /**
   * Human-readable migration name
   */
  name: string;

  /**
   * Apply the migration
   */
  up(dataSource: DataSource, schemaName: string): Promise<void>;

  /**
   * Rollback the migration
   */
  down(dataSource: DataSource, schemaName: string): Promise<void>;
}

