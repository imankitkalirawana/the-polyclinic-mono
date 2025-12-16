import { DataSource } from 'typeorm';
import { TenantMigration } from '../interfaces/tenant-migration.interface';

export class CreateOtpsTable20240101000001 implements TenantMigration {
  version = '20240101000001';
  name = 'CreateOtpsTable';

  async up(dataSource: DataSource, schemaName: string): Promise<void> {
    // Check if otps table exists, create if not
    const otpsTableExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'otps'
      );
    `,
      [schemaName],
    );

    if (!otpsTableExists[0].exists) {
      await dataSource.query(`
      CREATE TABLE "${schemaName}".otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL,
        code VARCHAR NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_otps_email_code" 
      ON "${schemaName}".otps(email, code);
    `);

    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_otps_email_verified" 
      ON "${schemaName}".otps(email, verified);
    `);

      await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_otps_expiresAt" 
        ON "${schemaName}".otps("expiresAt");
      `);
    }
  }

  async down(dataSource: DataSource, schemaName: string): Promise<void> {
    await dataSource.query(`DROP TABLE IF EXISTS "${schemaName}".otps CASCADE;`);
  }
}

