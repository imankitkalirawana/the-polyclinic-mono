import { DataSource } from 'typeorm';
import { TenantMigration } from '../interfaces/tenant-migration.interface';

export class AddReferenceFieldsToQueue20240101000003 implements TenantMigration {
  version = '20240101000003';
  name = 'AddReferenceFieldsToQueue';

  async up(dataSource: DataSource, schemaName: string): Promise<void> {
    // Check if ReferenceType enum exists, create if not
    const referenceTypeEnumExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'referencetype' 
        AND typnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = $1
        )
      );
    `,
      [schemaName],
    );

    if (!referenceTypeEnumExists[0].exists) {
      await dataSource.query(`
        CREATE TYPE "${schemaName}".referencetype AS ENUM (
          'PAYMENT'
        );
      `);
    }

    // Check and add referenceType column if it doesn't exist
    const referenceTypeColumnExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'appointment_queue'
        AND column_name = 'referencetype'
      );
    `,
      [schemaName],
    );

    if (!referenceTypeColumnExists[0].exists) {
      await dataSource.query(`
        ALTER TABLE "${schemaName}".appointment_queue 
        ADD COLUMN "referenceType" "${schemaName}".referencetype;
      `);
    }

    // Check and add referenceId column if it doesn't exist
    const referenceIdColumnExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'appointment_queue'
        AND column_name = 'referenceId'
      );
    `,
      [schemaName],
    );

    if (!referenceIdColumnExists[0].exists) {
      await dataSource.query(`
        ALTER TABLE "${schemaName}".appointment_queue 
        ADD COLUMN "referenceId" uuid;
      `);
    }

    // Migrate existing paymentId data if paymentId column exists
    const paymentIdColumnExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'appointment_queue'
        AND column_name = 'paymentId'
      );
    `,
      [schemaName],
    );

    if (paymentIdColumnExists[0].exists) {
      // Migrate existing paymentId to referenceType and referenceId
      await dataSource.query(`
        UPDATE "${schemaName}".appointment_queue 
        SET "referenceType" = 'PAYMENT', "referenceId" = "paymentId"
        WHERE "paymentId" IS NOT NULL;
      `);

      // Drop the old paymentId column after migration
      await dataSource.query(`
        ALTER TABLE "${schemaName}".appointment_queue 
        DROP COLUMN IF EXISTS "paymentId";
      `);
    }
  }

  async down(dataSource: DataSource, schemaName: string): Promise<void> {
    // Check if paymentId column exists, if not add it back
    const paymentIdColumnExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'appointment_queue'
        AND column_name = 'paymentId'
      );
    `,
      [schemaName],
    );

    if (!paymentIdColumnExists[0].exists) {
      await dataSource.query(`
        ALTER TABLE "${schemaName}".appointment_queue 
        ADD COLUMN "paymentId" uuid;
      `);

      // Migrate referenceId back to paymentId where referenceType is PAYMENT
      await dataSource.query(`
        UPDATE "${schemaName}".appointment_queue 
        SET "paymentId" = "referenceId"
        WHERE "referenceType" = 'PAYMENT' AND "referenceId" IS NOT NULL;
      `);
    }

    // Drop reference fields
    await dataSource.query(`
      ALTER TABLE "${schemaName}".appointment_queue 
      DROP COLUMN IF EXISTS "referenceId";
    `);

    await dataSource.query(`
      ALTER TABLE "${schemaName}".appointment_queue 
      DROP COLUMN IF EXISTS "referenceType";
    `);

    await dataSource.query(`DROP TYPE IF EXISTS "${schemaName}".referencetype;`);
  }
}
