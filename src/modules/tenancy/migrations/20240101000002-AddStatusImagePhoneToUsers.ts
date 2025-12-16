import { DataSource } from 'typeorm';
import { TenantMigration } from '../interfaces/tenant-migration.interface';

export class AddStatusImagePhoneToUsers20240101000002 implements TenantMigration {
  version = '20240101000002';
  name = 'AddStatusImagePhoneToUsers';

  async up(dataSource: DataSource, schemaName: string): Promise<void> {
    // Check if Status enum exists, create if not
    const statusEnumExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'status' 
        AND typnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = $1
        )
      );
    `,
      [schemaName],
    );

    if (!statusEnumExists[0].exists) {
      await dataSource.query(`
        CREATE TYPE "${schemaName}".status AS ENUM (
          'ACTIVE',
          'INACTIVE'
        );
      `);
    }

    // Check and add status column if it doesn't exist
    const statusColumnExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'users'
        AND column_name = 'status'
      );
    `,
      [schemaName],
    );

    if (!statusColumnExists[0].exists) {
      await dataSource.query(`
        ALTER TABLE "${schemaName}".users 
        ADD COLUMN status "${schemaName}".status NOT NULL DEFAULT 'ACTIVE';
      `);
    }

    // Check and add image column if it doesn't exist
    const imageColumnExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'users'
        AND column_name = 'image'
      );
    `,
      [schemaName],
    );

    if (!imageColumnExists[0].exists) {
      await dataSource.query(`
        ALTER TABLE "${schemaName}".users 
        ADD COLUMN image VARCHAR;
      `);
    }

    // Check and add phone column if it doesn't exist
    const phoneColumnExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'users'
        AND column_name = 'phone'
      );
    `,
      [schemaName],
    );

    if (!phoneColumnExists[0].exists) {
      await dataSource.query(`
        ALTER TABLE "${schemaName}".users 
        ADD COLUMN phone VARCHAR;
      `);
    }
  }

  async down(dataSource: DataSource, schemaName: string): Promise<void> {
    await dataSource.query(`
      ALTER TABLE "${schemaName}".users 
      DROP COLUMN IF EXISTS phone;
    `);

    await dataSource.query(`
      ALTER TABLE "${schemaName}".users 
      DROP COLUMN IF EXISTS image;
    `);

    await dataSource.query(`
      ALTER TABLE "${schemaName}".users 
      DROP COLUMN IF EXISTS status;
    `);

    await dataSource.query(`DROP TYPE IF EXISTS "${schemaName}".status;`);
  }
}
