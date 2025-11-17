import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRealtorIdNullValues1733500001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if there are NULL values in realtorId
    const nullCountResult = await queryRunner.query(
      `SELECT COUNT(*)::int as count FROM properties WHERE "realtorId" IS NULL`
    );
    const nullCount = nullCountResult[0]?.count || 0;
    
    if (nullCount > 0) {
      // Get the first admin or CORRETOR user to use as default
      const defaultUserResult = await queryRunner.query(
        `SELECT id FROM users WHERE role IN ('ADMIN', 'CORRETOR') LIMIT 1`
      );
      
      if (defaultUserResult.length > 0) {
        const defaultUserId = defaultUserResult[0].id;
        // Update NULL values with default user
        await queryRunner.query(
          `UPDATE properties SET "realtorId" = '${defaultUserId}' WHERE "realtorId" IS NULL`
        );
      } else {
        // If no admin/corretor exists, delete properties without realtor
        await queryRunner.query(
          `DELETE FROM properties WHERE "realtorId" IS NULL`
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No rollback needed - this migration only fixes data
  }
}

