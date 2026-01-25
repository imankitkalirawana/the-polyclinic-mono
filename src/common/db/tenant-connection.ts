import { DataSource } from 'typeorm';
import { getTenantConnectionConfig } from '../../tenant-orm.config';

/**
 * Simple in-memory connection pool for tenant schemas.
 * - Uses one DataSource per schema name
 * - Reuses initialized connections across requests
 */
const connections = new Map<string, DataSource>();

export async function getTenantConnection(
  tenantSlug: string,
): Promise<DataSource> {
  if (connections.has(tenantSlug)) {
    const existing = connections.get(tenantSlug);
    if (existing?.isInitialized) return existing;
  }

  const config = getTenantConnectionConfig(tenantSlug);
  const connection = new DataSource(config);
  if (!connection.isInitialized) {
    await connection.initialize();
  }

  connections.set(tenantSlug, connection);
  return connection;
}

export async function closeAllTenantConnections(): Promise<void> {
  for (const [tenantSlug, connection] of connections.entries()) {
    try {
      if (connection.isInitialized) {
        await connection.destroy();
      }
    } finally {
      connections.delete(tenantSlug);
    }
  }
}
