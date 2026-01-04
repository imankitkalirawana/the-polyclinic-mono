import { DataSource } from 'typeorm';
import { TenantMigration } from '../interfaces/tenant-migration.interface';

export class CreateActivityLogsTable20240101000004 implements TenantMigration {
  version = '20240101000004';
  name = 'CreateActivityLogsTable';

  async up(dataSource: DataSource, schemaName: string): Promise<void> {
    const activityLogsTableExists = await dataSource.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'activity_logs'
      );
    `,
      [schemaName],
    );

    if (!activityLogsTableExists[0].exists) {
      await dataSource.query(`
        CREATE TYPE "${schemaName}".activity_action AS ENUM (
          'CREATED',
          'UPDATED',
          'STATUS_CHANGED',
          'DELETED',
          'SOFT_DELETED'
        );
      `);

      await dataSource.query(`
        CREATE TYPE "${schemaName}".actor_type AS ENUM (
          'USER',
          'SYSTEM'
        );
      `);

      await dataSource.query(`
        CREATE TABLE "${schemaName}".activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "entityType" VARCHAR(255) NOT NULL,
          "entityId" UUID NOT NULL,
          module VARCHAR(255) NOT NULL,
          action "${schemaName}".activity_action NOT NULL,
          "changedFields" JSONB,
          "previousData" JSONB,
          "newData" JSONB,
          "actorType" "${schemaName}".actor_type NOT NULL,
          "actorId" UUID,
          "actorRole" VARCHAR(255),
          description TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_activity_logs_entityType" 
        ON "${schemaName}".activity_logs("entityType");
      `);

      await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_activity_logs_entityId" 
        ON "${schemaName}".activity_logs("entityId");
      `);

      await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_activity_logs_actorId" 
        ON "${schemaName}".activity_logs("actorId");
      `);

      await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schemaName}_activity_logs_createdAt" 
        ON "${schemaName}".activity_logs("createdAt");
      `);

      await dataSource.query(`
        ALTER TABLE "${schemaName}".activity_logs
        ADD CONSTRAINT "FK_${schemaName}_activity_logs_actorId"
        FOREIGN KEY ("actorId")
        REFERENCES "${schemaName}".users(id)
        ON DELETE SET NULL;
      `);
    } else {
      const fkExists = await dataSource.query(
        `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_schema = $1
          AND constraint_name = 'FK_${schemaName}_activity_logs_actorId'
        );
      `,
        [schemaName],
      );

      if (!fkExists[0].exists) {
        await dataSource.query(`
          ALTER TABLE "${schemaName}".activity_logs
          ADD CONSTRAINT "FK_${schemaName}_activity_logs_actorId"
          FOREIGN KEY ("actorId")
          REFERENCES "${schemaName}".users(id)
          ON DELETE SET NULL;
        `);
      }
    }
  }

  async down(dataSource: DataSource, schemaName: string): Promise<void> {
    await dataSource.query(
      `DROP TABLE IF EXISTS "${schemaName}".activity_logs CASCADE;`,
    );
    await dataSource.query(`DROP TYPE IF EXISTS "${schemaName}".actor_type;`);
    await dataSource.query(
      `DROP TYPE IF EXISTS "${schemaName}".activity_action;`,
    );
  }
}
