import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorSpecializationTable1771081389094 implements MigrationInterface {
  name = 'AddDoctorSpecializationTable1771081389094';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "doctor_specializations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6b40116261ac0e499c443e525c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c8b660fc5d0812a689a6d6f072" ON "doctor_specializations" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_doctor_specializations" ("doctor_id" uuid NOT NULL, "specialization_id" uuid NOT NULL, CONSTRAINT "PK_ace29b972ba8f3c8656ae88ccbb" PRIMARY KEY ("doctor_id", "specialization_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f33052db59ed48e129449e255" ON "doctor_doctor_specializations" ("doctor_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_684001472f9c2cb6e04875f1f1" ON "doctor_doctor_specializations" ("specialization_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "login_users" ALTER COLUMN "companies" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_doctor_specializations" ADD CONSTRAINT "FK_8f33052db59ed48e129449e2555" FOREIGN KEY ("doctor_id") REFERENCES "doctor_doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_doctor_specializations" ADD CONSTRAINT "FK_684001472f9c2cb6e04875f1f1c" FOREIGN KEY ("specialization_id") REFERENCES "doctor_specializations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "doctor_doctor_specializations" DROP CONSTRAINT "FK_684001472f9c2cb6e04875f1f1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_doctor_specializations" DROP CONSTRAINT "FK_8f33052db59ed48e129449e2555"`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_users" ALTER COLUMN "companies" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_684001472f9c2cb6e04875f1f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8f33052db59ed48e129449e255"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_doctor_specializations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c8b660fc5d0812a689a6d6f072"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_specializations"`);
  }
}
