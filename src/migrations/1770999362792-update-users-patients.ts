import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersPatients1770999362792 implements MigrationInterface {
  name = 'UpdateUsersPatients1770999362792';

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
