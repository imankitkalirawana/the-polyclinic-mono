import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { ActivityLog } from './modules/common/activity/entities/activity-log.entity';

export function getTenantConnectionConfig(
  tenantSlug: string,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    schema: tenantSlug,
    entities: [
      join(__dirname, './modules/client/**/entities/*.entity.{ts,js}'),
      ActivityLog,
    ],
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
    ssl: {
      rejectUnauthorized: false,
    },
  };
}
