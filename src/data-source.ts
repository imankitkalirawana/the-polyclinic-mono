import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { publicOrmConfig } from './orm.config';
import { Tenant } from './modules/public/tenants/entities/tenant.entity';
import { User } from './modules/users/entities/user.entity';
import { Otp } from './modules/auth/entities/otp.entity';
import { Session } from './modules/auth/entities/session.entity';

export const AppDataSource = new DataSource({
  ...publicOrmConfig,
  entities: [
    ...(Array.isArray(publicOrmConfig.entities)
      ? (publicOrmConfig.entities as any[])
      : []),
    User,
    Session,
    Otp,
    Tenant,
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'migrations',
  migrationsRun: false,
});
