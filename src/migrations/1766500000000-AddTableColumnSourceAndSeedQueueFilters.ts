import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableColumnSourceAndSeedQueueFilters1766500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_columns_source_type_enum') THEN
          CREATE TYPE "public"."table_columns_source_type_enum" AS ENUM ('ENUM', 'ENTITY', 'DISTINCT_FIELD');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_columns_view_type_enum') THEN
          CREATE TYPE "public"."table_columns_view_type_enum" AS ENUM ('QUEUE', 'PATIENT', 'DOCTOR', 'USER');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."table_columns"
      ADD COLUMN IF NOT EXISTS "source_type" "public"."table_columns_source_type_enum" NULL,
      ADD COLUMN IF NOT EXISTS "source_config" jsonb NULL,
      ADD COLUMN IF NOT EXISTS "view_type" "public"."table_columns_view_type_enum" NULL;
    `);

    await queryRunner.query(`
      INSERT INTO "public"."table_columns" ("id", "key", "name", "data_type", "is_sortable", "source_type", "source_config", "view_type", "createdAt", "updatedAt")
      SELECT gen_random_uuid(), 'status', 'Status', 'STRING', false, 'ENUM', '{"enumName": "QueueStatus"}', 'QUEUE', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "public"."table_columns" WHERE "key" = 'status' AND "view_type" = 'QUEUE');
    `);
    await queryRunner.query(`
      INSERT INTO "public"."table_columns" ("id", "key", "name", "data_type", "is_sortable", "source_type", "source_config", "view_type", "createdAt", "updatedAt")
      SELECT gen_random_uuid(), 'doctorId', 'Doctor', 'STRING', false, 'ENTITY', '{"entityName": "Doctor", "valueField": "id", "labelField": "user.name"}', 'QUEUE', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "public"."table_columns" WHERE "key" = 'doctorId' AND "view_type" = 'QUEUE');
    `);
    await queryRunner.query(`
      INSERT INTO "public"."table_columns" ("id", "key", "name", "data_type", "is_sortable", "source_type", "source_config", "view_type", "createdAt", "updatedAt")
      SELECT gen_random_uuid(), 'appointmentDate', 'Date', 'DATE', false, 'DISTINCT_FIELD', '{"entityName": "Queue", "field": "appointmentDate"}', 'QUEUE', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "public"."table_columns" WHERE "key" = 'appointmentDate' AND "view_type" = 'QUEUE');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "public"."table_columns" WHERE "view_type" = 'QUEUE' AND "key" IN ('status', 'doctorId', 'appointmentDate');
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."table_columns"
      DROP COLUMN IF EXISTS "source_type",
      DROP COLUMN IF EXISTS "source_config",
      DROP COLUMN IF EXISTS "view_type";
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."table_columns_source_type_enum";
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."table_columns_view_type_enum";
    `);
  }
}
