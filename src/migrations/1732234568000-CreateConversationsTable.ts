import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateConversationsTable1732234568000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para status da conversa
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "conversation_status_enum" AS ENUM('active', 'ended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar tabela conversations
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'instanceName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'ended'],
            enumName: 'conversation_status_enum',
            default: "'active'",
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'endedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_phoneNumber',
        columnNames: ['phoneNumber'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_status',
        columnNames: ['status'],
      }),
    );

    // Criar foreign key para users
    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    const table = await queryRunner.getTable('conversations');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('conversations', foreignKey);
    }

    // Remover índices
    await queryRunner.dropIndex('conversations', 'IDX_conversations_status');
    await queryRunner.dropIndex('conversations', 'IDX_conversations_userId');
    await queryRunner.dropIndex('conversations', 'IDX_conversations_phoneNumber');

    // Remover tabela
    await queryRunner.dropTable('conversations');

    // Remover enum
    await queryRunner.query(`DROP TYPE IF EXISTS "conversation_status_enum"`);
  }
}

