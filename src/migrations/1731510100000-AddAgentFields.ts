import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAgentFields1731510100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // users.preferredAgentId
    const hasPreferredAgentId = await queryRunner.hasColumn('users', 'preferredAgentId');
    if (!hasPreferredAgentId) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'preferredAgentId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    // conversations.currentAgentId
    const hasCurrentAgentId = await queryRunner.hasColumn('conversations', 'currentAgentId');
    if (!hasCurrentAgentId) {
      await queryRunner.addColumn(
        'conversations',
        new TableColumn({
          name: 'currentAgentId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    // messages.agentId
    const hasAgentId = await queryRunner.hasColumn('messages', 'agentId');
    if (!hasAgentId) {
      await queryRunner.addColumn(
        'messages',
        new TableColumn({
          name: 'agentId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasAgentId = await queryRunner.hasColumn('messages', 'agentId');
    if (hasAgentId) {
      await queryRunner.dropColumn('messages', 'agentId');
    }

    const hasCurrentAgentId = await queryRunner.hasColumn('conversations', 'currentAgentId');
    if (hasCurrentAgentId) {
      await queryRunner.dropColumn('conversations', 'currentAgentId');
    }

    const hasPreferredAgentId = await queryRunner.hasColumn('users', 'preferredAgentId');
    if (hasPreferredAgentId) {
      await queryRunner.dropColumn('users', 'preferredAgentId');
    }
  }
}


