import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantMigration } from '../interfaces/tenant-migration.interface';
import * as migrations from '../migrations';

@Injectable()
export class TenantMigrationService {
  private readonly logger = new Logger(TenantMigrationService.name);
  private readonly migrationList: TenantMigration[];

  constructor(private readonly dataSource: DataSource) {
    // Load all migrations from the migrations directory
    // Object.values returns class constructors, so we need to instantiate them
    this.migrationList = Object.values(migrations)
      .filter(
        (MigrationClass) =>
          MigrationClass &&
          typeof MigrationClass === 'function' &&
          MigrationClass.prototype,
      )
      .map(
        (MigrationClass) => new (MigrationClass as new () => TenantMigration)(),
      )
      .filter((migration) => migration.version && migration.name)
      .sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Run all pending migrations for a tenant
   */
  async runMigrations(tenantSlug: string): Promise<void> {
    const schemaName = tenantSlug;
    this.logger.log(
      `Running migrations for tenant: ${tenantSlug} (schema: ${schemaName})`,
    );

    try {
      // Ensure migrations table exists
      await this.ensureMigrationsTable(schemaName);

      // Get list of already executed migrations
      const executedMigrations = await this.getExecutedMigrations(schemaName);

      // Filter out already executed migrations
      const pendingMigrations = this.migrationList.filter(
        (migration) => !executedMigrations.includes(migration.version),
      );

      if (pendingMigrations.length === 0) {
        this.logger.log(`No pending migrations for tenant: ${tenantSlug}`);
        return;
      }

      this.logger.log(
        `Found ${pendingMigrations.length} pending migration(s) for tenant: ${tenantSlug}`,
      );

      // Run each pending migration
      for (const migration of pendingMigrations) {
        try {
          this.logger.log(
            `Running migration ${migration.version}: ${migration.name} for tenant: ${tenantSlug}`,
          );
          await migration.up(this.dataSource, schemaName);
          await this.recordMigration(
            schemaName,
            migration.version,
            migration.name,
          );
          this.logger.log(
            `Successfully applied migration ${migration.version} for tenant: ${tenantSlug}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to apply migration ${migration.version} for tenant ${tenantSlug}:`,
            error,
          );
          throw error;
        }
      }

      this.logger.log(`All migrations completed for tenant: ${tenantSlug}`);
    } catch (error) {
      this.logger.error(
        `Error running migrations for tenant ${tenantSlug}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Rollback the last migration for a tenant
   */
  async rollbackLastMigration(tenantSlug: string): Promise<void> {
    const schemaName = tenantSlug;
    this.logger.log(
      `Rolling back last migration for tenant: ${tenantSlug} (schema: ${schemaName})`,
    );

    try {
      const executedMigrations = await this.getExecutedMigrations(schemaName);
      if (executedMigrations.length === 0) {
        this.logger.log(`No migrations to rollback for tenant: ${tenantSlug}`);
        return;
      }

      // Get the last executed migration
      const lastMigrationVersion =
        executedMigrations[executedMigrations.length - 1];
      const migration = this.migrationList.find(
        (m) => m.version === lastMigrationVersion,
      );

      if (!migration) {
        throw new Error(
          `Migration ${lastMigrationVersion} not found in migration list`,
        );
      }

      this.logger.log(
        `Rolling back migration ${migration.version}: ${migration.name} for tenant: ${tenantSlug}`,
      );
      await migration.down(this.dataSource, schemaName);
      await this.removeMigrationRecord(schemaName, migration.version);
      this.logger.log(
        `Successfully rolled back migration ${migration.version} for tenant: ${tenantSlug}`,
      );
    } catch (error) {
      this.logger.error(
        `Error rolling back migration for tenant ${tenantSlug}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get migration status for a tenant
   */
  async getMigrationStatus(tenantSlug: string): Promise<{
    executed: string[];
    pending: string[];
    total: number;
  }> {
    const schemaName = tenantSlug;
    await this.ensureMigrationsTable(schemaName);

    const executedMigrations = await this.getExecutedMigrations(schemaName);
    const pendingMigrations = this.migrationList
      .filter((m) => !executedMigrations.includes(m.version))
      .map((m) => m.version);

    return {
      executed: executedMigrations,
      pending: pendingMigrations,
      total: this.migrationList.length,
    };
  }

  private async ensureMigrationsTable(schemaName: string): Promise<void> {
    const tableExists = await this.tableExists(schemaName, 'tenant_migrations');
    if (tableExists) {
      return;
    }

    await this.dataSource.query(`
      CREATE TABLE "${schemaName}".tenant_migrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        "executedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_tenant_migrations_version" 
      ON "${schemaName}".tenant_migrations(version);
    `);

    this.logger.log(`Created tenant_migrations table in schema ${schemaName}`);
  }

  private async tableExists(
    schemaName: string,
    tableName: string,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = $2
      );
    `,
      [schemaName, tableName],
    );
    return result[0].exists;
  }

  private async getExecutedMigrations(schemaName: string): Promise<string[]> {
    try {
      const result = await this.dataSource.query(
        `
        SELECT version FROM "${schemaName}".tenant_migrations 
        ORDER BY "executedAt" ASC;
      `,
      );
      return result.map((row: any) => row.version);
    } catch (error) {
      this.logger.error(
        `Error getting executed migrations for schema ${schemaName}:`,
        error,
      );
      // Table might not exist yet
      return [];
    }
  }

  private async recordMigration(
    schemaName: string,
    version: string,
    name: string,
  ): Promise<void> {
    await this.dataSource.query(
      `
      INSERT INTO "${schemaName}".tenant_migrations (version, name) 
      VALUES ($1, $2);
    `,
      [version, name],
    );
  }

  private async removeMigrationRecord(
    schemaName: string,
    version: string,
  ): Promise<void> {
    await this.dataSource.query(
      `
      DELETE FROM "${schemaName}".tenant_migrations 
      WHERE version = $1;
    `,
      [version],
    );
  }
}
