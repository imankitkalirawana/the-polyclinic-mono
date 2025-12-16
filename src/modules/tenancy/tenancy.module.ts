import { Module, Scope, OnModuleDestroy } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { CONNECTION } from './tenancy.symbols';
import { getTenantConnectionConfig } from '../../tenant-orm.config';
import { TenantMigrationService } from './services/tenant-migration.service';
import { TenantAuthInitService } from './tenant-auth-init.service';

// Connection pool to reuse connections
const connections = new Map<string, DataSource>();

const connectionFactory = {
  provide: CONNECTION,
  scope: Scope.REQUEST,
  useFactory: async (request: Request): Promise<DataSource | null> => {
    const tenantSlug = (request as any).tenantSlug;

    if (!tenantSlug) {
      return null;
    }

    // Check if connection already exists
    if (connections.has(tenantSlug)) {
      const existingConnection = connections.get(tenantSlug);
      if (existingConnection?.isInitialized) {
        return existingConnection;
      }
    }

    // Create new connection
    const config = getTenantConnectionConfig(tenantSlug);
    const connection = new DataSource(config);

    if (!connection.isInitialized) {
      await connection.initialize();
    }

    connections.set(tenantSlug, connection);
    return connection;
  },
  inject: [REQUEST],
};

@Module({
  providers: [
    connectionFactory,
    TenantMigrationService,
    TenantAuthInitService,
  ],
  exports: [CONNECTION, TenantMigrationService, TenantAuthInitService],
})
export class TenancyModule implements OnModuleDestroy {
  async onModuleDestroy() {
    // Close all connections on module destroy
    for (const [tenantSlug, connection] of connections.entries()) {
      if (connection.isInitialized) {
        await connection.destroy();
      }
      connections.delete(tenantSlug);
    }
  }
}
