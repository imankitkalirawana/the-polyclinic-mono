import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getTenantSchemaName } from './tenancy.utils';
import { TenantMigrationService } from './services/tenant-migration.service';

@Injectable()
export class TenantAuthInitService {
  private readonly logger = new Logger(TenantAuthInitService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly migrationService: TenantMigrationService,
  ) {}

  /**
   * Initialize auth tables for a tenant schema
   * This creates the schema and runs all pending migrations
   */
  async initializeTenantAuth(tenantSlug: string): Promise<void> {
    const schemaName = getTenantSchemaName(tenantSlug);
    this.logger.log(
      `Initializing auth tables for tenant: ${tenantSlug} (schema: ${schemaName})`,
    );

    try {
      // Create schema if it doesn't exist
      await this.dataSource.query(
        `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
      );

      // Run all pending migrations
      await this.migrationService.runMigrations(tenantSlug);

      this.logger.log(
        `Successfully initialized auth tables for tenant: ${tenantSlug}`,
      );
    } catch (error) {
      this.logger.error(
        `Error initializing auth tables for tenant ${tenantSlug}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Ensure auth tables exist for a tenant (idempotent)
   * Creates schema if needed and runs all pending migrations
   */
  async ensureTenantAuthTables(tenantSlug: string): Promise<void> {
    const schemaName = getTenantSchemaName(tenantSlug);

    try {
      // Create schema if it doesn't exist
      await this.dataSource.query(
        `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
      );

      // Run migrations (they are idempotent - only pending ones will run)
      await this.migrationService.runMigrations(tenantSlug);
    } catch (error) {
      this.logger.error(
        `Error ensuring auth tables for tenant ${tenantSlug}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Initialize auth tables for all existing tenants
   * Useful for migration or fixing existing tenants
   */
  async initializeAllTenantsAuth(): Promise<void> {
    try {
      const tenants = await this.dataSource.query(`
        SELECT slug FROM public.tenants;
      `);

      this.logger.log(
        `Initializing auth tables for ${tenants.length} tenants...`,
      );

      for (const tenant of tenants) {
        try {
          await this.ensureTenantAuthTables(tenant.slug);
        } catch (error) {
          this.logger.error(
            `Failed to initialize auth for tenant ${tenant.slug}:`,
            error,
          );
          // Continue with other tenants even if one fails
        }
      }

      this.logger.log('Finished initializing auth tables for all tenants');
    } catch (error) {
      this.logger.error('Error initializing auth for all tenants:', error);
      throw error;
    }
  }
}
