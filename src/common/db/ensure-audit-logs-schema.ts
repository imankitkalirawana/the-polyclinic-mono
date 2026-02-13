import { DataSource } from 'typeorm';

/**
 * Ensures audit_logs table (and its enum types) exist in the given schema.
 * Called when initializing a tenant connection so the AuditLogSubscriber can insert.
 * Safe to call multiple times (uses IF NOT EXISTS / DO $$ guards).
 */
export async function ensureAuditLogsInSchema(
  dataSource: DataSource,
  schema: string,
): Promise<void> {
  const q = dataSource.createQueryRunner();
  const escapedSchema = `"${schema.replace(/"/g, '""')}"`;

  try {
    // Create enum types in the tenant schema (TypeORM-style names)
    await q.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON t.typnamespace = n.oid
          WHERE n.nspname = ${escapeLiteral(schema)} AND t.typname = 'audit_logs_item_type_enum'
        ) THEN
          CREATE TYPE ${escapedSchema}.audit_logs_item_type_enum AS ENUM (
            'User', 'Patient', 'Doctor', 'Company', 'Queue', 'Payment'
          );
        END IF;
      END $$;
    `);
    await q.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON t.typnamespace = n.oid
          WHERE n.nspname = ${escapeLiteral(schema)} AND t.typname = 'audit_logs_event_enum'
        ) THEN
          CREATE TYPE ${escapedSchema}.audit_logs_event_enum AS ENUM (
            'CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE'
          );
        END IF;
      END $$;
    `);
    await q.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON t.typnamespace = n.oid
          WHERE n.nspname = ${escapeLiteral(schema)} AND t.typname = 'audit_logs_actor_type_enum'
        ) THEN
          CREATE TYPE ${escapedSchema}.audit_logs_actor_type_enum AS ENUM ('USER', 'SYSTEM');
        END IF;
      END $$;
    `);

    // Create table if not exists (matches AuditLog entity + BaseEntity)
    await q.query(`
      CREATE TABLE IF NOT EXISTS ${escapedSchema}.audit_logs (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "item_id" uuid,
        "item_type" ${escapedSchema}.audit_logs_item_type_enum NOT NULL,
        "event" ${escapedSchema}.audit_logs_event_enum NOT NULL,
        "actor_id" uuid,
        "actor_type" ${escapedSchema}.audit_logs_actor_type_enum NOT NULL DEFAULT 'SYSTEM',
        "object_changes" jsonb,
        "ip" character varying(45),
        "user_agent" text,
        "request_id" character varying(100),
        "source" character varying(50),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      );
    `);

    // Indexes (match entity @Index() on item_id and actor_id)
    await q.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_item_id"
      ON ${escapedSchema}.audit_logs ("item_id");
    `);
    await q.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_actor_id"
      ON ${escapedSchema}.audit_logs ("actor_id");
    `);
  } finally {
    await q.release();
  }
}

function escapeLiteral(s: string): string {
  return "'" + s.replace(/'/g, "''") + "'";
}
