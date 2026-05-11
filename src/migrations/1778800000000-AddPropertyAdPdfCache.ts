import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyAdPdfCache1778800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "adPdfUrl" varchar(500),
      ADD COLUMN IF NOT EXISTS "adPdfPath" varchar(500),
      ADD COLUMN IF NOT EXISTS "adPdfGeneratedAt" timestamptz;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "adPdfGeneratedAt",
      DROP COLUMN IF EXISTS "adPdfPath",
      DROP COLUMN IF EXISTS "adPdfUrl";
    `);
  }
}
