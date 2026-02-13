import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatus1770997527837 implements MigrationInterface {
  name = 'AddUserStatus1770997527837';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patient_patients" DROP COLUMN "vitals"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."login_users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_users" ADD "status" "public"."login_users_status_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."table_columns_column_type_enum" AS ENUM('DEFAULT', 'CHIP', 'EMAIL', 'PHONE', 'URL', 'DATE', 'TIME', 'DATETIME')`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_columns" ADD "column_type" "public"."table_columns_column_type_enum" NOT NULL DEFAULT 'DEFAULT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_users" ALTER COLUMN "companies" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(`ALTER TABLE "patient_patients" DROP COLUMN "dob"`);
    await queryRunner.query(
      `ALTER TABLE "patient_patients" ADD "dob" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_patients" DROP COLUMN "address"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_patients" ADD "address" character varying`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."table_columns_data_type_enum" RENAME TO "table_columns_data_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."table_columns_data_type_enum" AS ENUM('STRING', 'INTEGER', 'DATE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_columns" ALTER COLUMN "data_type" TYPE "public"."table_columns_data_type_enum" USING "data_type"::"text"::"public"."table_columns_data_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."table_columns_data_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."table_columns_data_type_enum_old" AS ENUM('STRING', 'INTEGER', 'HASHTAG', 'DATE', 'TIME', 'DATETIME')`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_columns" ALTER COLUMN "data_type" TYPE "public"."table_columns_data_type_enum_old" USING "data_type"::"text"::"public"."table_columns_data_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."table_columns_data_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."table_columns_data_type_enum_old" RENAME TO "table_columns_data_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_patients" DROP COLUMN "address"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_patients" ADD "address" text`,
    );
    await queryRunner.query(`ALTER TABLE "patient_patients" DROP COLUMN "dob"`);
    await queryRunner.query(`ALTER TABLE "patient_patients" ADD "dob" date`);
    await queryRunner.query(
      `ALTER TABLE "login_users" ALTER COLUMN "companies" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_columns" DROP COLUMN "column_type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."table_columns_column_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "login_users" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."login_users_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "patient_patients" ADD "vitals" jsonb`,
    );
  }
}
