import { Module, Scope, OnModuleDestroy } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { CONNECTION } from './tenancy.symbols';
import { getTenantConnectionConfig } from '../../tenant-orm.config';

// Connection pool to reuse connections
const connections = new Map<string, DataSource>();

const connectionFactory = {
  provide: CONNECTION,
  scope: Scope.REQUEST,
  useFactory: async (request: Request): Promise<DataSource | null> => {
    const tenantId = (request as any).tenantId;

    if (!tenantId) {
      return null;
    }

    // Check if connection already exists
    if (connections.has(tenantId)) {
      const existingConnection = connections.get(tenantId);
      if (existingConnection?.isInitialized) {
        return existingConnection;
      }
    }

    // Create new connection
    const config = getTenantConnectionConfig(tenantId);
    const connection = new DataSource(config);

    if (!connection.isInitialized) {
      await connection.initialize();
    }

    connections.set(tenantId, connection);
    return connection;
  },
  inject: [REQUEST],
};

@Module({
  providers: [connectionFactory],
  exports: [CONNECTION],
})
export class TenancyModule implements OnModuleDestroy {
  async onModuleDestroy() {
    // Close all connections on module destroy
    for (const [tenantId, connection] of connections.entries()) {
      if (connection.isInitialized) {
        await connection.destroy();
      }
      connections.delete(tenantId);
    }
  }
}
