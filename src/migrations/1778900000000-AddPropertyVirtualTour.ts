import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyVirtualTour1778900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "tourImageUrl" varchar(500),
      ADD COLUMN IF NOT EXISTS "tourImagePath" varchar(500);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "tourImagePath",
      DROP COLUMN IF EXISTS "tourImageUrl";
    `);
  }
}
