import { DataSource } from 'typeorm';
import { TenantMigration } from '../interfaces/tenant-migration.interface';

export class CreateAuthTables20240101000000 implements TenantMigration {
  version = '20240101000000';
  name = 'CreateAuthTables';

  async up(dataSource: DataSource, schemaName: string): Promise<void> {
    // Check if Role enum exists, create if not
    const roleEnumExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'role' 
        AND typnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = $1
        )
      );
    `,
      [schemaName],
    );

    if (!roleEnumExists[0].exists) {
      await dataSource.query(`
        CREATE TYPE "${schemaName}".role AS ENUM (
          'SUPERADMIN',
          'MODERATOR',
          'OPS',
          'ADMIN',
          'PATIENT',
          'DOCTOR',
          'NURSE',
          'RECEPTIONIST'
        );
      `);
    }

    // Check if users table exists, create if not
    const usersTableExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'users'
      );
    `,
      [schemaName],
    );

    if (!usersTableExists[0].exists) {
      // Create users table
      await dataSource.query(`
      CREATE TABLE "${schemaName}".users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL UNIQUE,
        password VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        role "${schemaName}".role NOT NULL DEFAULT 'PATIENT',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

      await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_users_email" 
        ON "${schemaName}".users(email);
      `);
    }

    // Check if sessions table exists, create if not
    const sessionsTableExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'sessions'
      );
    `,
      [schemaName],
    );

    if (!sessionsTableExists[0].exists) {
      // Create sessions table
      await dataSource.query(`
      CREATE TABLE "${schemaName}".sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token VARCHAR NOT NULL,
        "userId" UUID NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_${schemaName}_sessions_userId" 
          FOREIGN KEY ("userId") 
          REFERENCES "${schemaName}".users(id) 
          ON DELETE CASCADE
      );
    `);

      await dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_${schemaName}_sessions_token" 
      ON "${schemaName}".sessions(token);
    `);

      await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_sessions_expiresAt" 
      ON "${schemaName}".sessions("expiresAt");
    `);

      await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_sessions_userId" 
        ON "${schemaName}".sessions("userId");
      `);
    }
  }

  async down(dataSource: DataSource, schemaName: string): Promise<void> {
    await dataSource.query(
      `DROP TABLE IF EXISTS "${schemaName}".sessions CASCADE;`,
    );
    await dataSource.query(
      `DROP TABLE IF EXISTS "${schemaName}".users CASCADE;`,
    );
    await dataSource.query(`DROP TYPE IF EXISTS "${schemaName}".role;`);
  }
}
