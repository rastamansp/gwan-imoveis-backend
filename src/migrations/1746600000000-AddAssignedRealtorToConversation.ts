import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddAssignedRealtorToConversation1746600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('conversations', 'assignedRealtorId');
    if (hasColumn) return;

    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'assignedRealtorId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        name: 'FK_conversations_assignedRealtor',
        columnNames: ['assignedRealtorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_assignedRealtorId',
        columnNames: ['assignedRealtorId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('conversations', 'assignedRealtorId');
    if (!hasColumn) return;

    await queryRunner.dropIndex('conversations', 'IDX_conversations_assignedRealtorId');
    await queryRunner.dropForeignKey('conversations', 'FK_conversations_assignedRealtor');
    await queryRunner.dropColumn('conversations', 'assignedRealtorId');
  }
}
