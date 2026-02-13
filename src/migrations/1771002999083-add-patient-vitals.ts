import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatientVitals1771002999083 implements MigrationInterface {
  name = 'AddPatientVitals1771002999083';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patient_patients" ADD "vitals" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_users" ALTER COLUMN "companies" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(`ALTER TABLE "patient_patients" DROP COLUMN "dob"`);
    await queryRunner.query(`ALTER TABLE "patient_patients" ADD "dob" date`);
    await queryRunner.query(
      `ALTER TABLE "patient_patients" DROP COLUMN "address"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_patients" ADD "address" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patient_patients" DROP COLUMN "address"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_patients" ADD "address" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "patient_patients" DROP COLUMN "dob"`);
    await queryRunner.query(
      `ALTER TABLE "patient_patients" ADD "dob" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_users" ALTER COLUMN "companies" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_patients" DROP COLUMN "vitals"`,
    );
  }
}
