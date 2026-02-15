import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAuthSource1771054420749 implements MigrationInterface {
  name = 'AddUserAuthSource1771054420749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "login_users" ALTER COLUMN "companies" SET DEFAULT ARRAY[]::text[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "login_users" ALTER COLUMN "companies" SET DEFAULT ARRAY[]`,
    );
  }
}
