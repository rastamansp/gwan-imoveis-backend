import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignedRealtorIdToConversations1778124158804 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversations"
      ADD COLUMN IF NOT EXISTS "assignedRealtorId" uuid NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_assignedRealtorId"
      ON "conversations" ("assignedRealtorId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_assignedRealtorId"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "assignedRealtorId"`);
  }
}
