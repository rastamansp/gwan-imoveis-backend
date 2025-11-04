import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMessagesTable1732234569000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para direção da mensagem
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "message_direction_enum" AS ENUM('incoming', 'outgoing');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar tabela messages
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'messageId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'direction',
            type: 'enum',
            enum: ['incoming', 'outgoing'],
            enumName: 'message_direction_enum',
            isNullable: false,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'toolsUsed',
            type: 'jsonb',
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
      'messages',
      new TableIndex({
        name: 'IDX_messages_conversationId',
        columnNames: ['conversationId'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_messageId',
        columnNames: ['messageId'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_direction',
        columnNames: ['direction'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_timestamp',
        columnNames: ['timestamp'],
      }),
    );

    // Criar foreign key para conversations
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    const table = await queryRunner.getTable('messages');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('conversationId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('messages', foreignKey);
    }

    // Remover índices
    await queryRunner.dropIndex('messages', 'IDX_messages_timestamp');
    await queryRunner.dropIndex('messages', 'IDX_messages_direction');
    await queryRunner.dropIndex('messages', 'IDX_messages_messageId');
    await queryRunner.dropIndex('messages', 'IDX_messages_conversationId');

    // Remover tabela
    await queryRunner.dropTable('messages');

    // Remover enum
    await queryRunner.query(`DROP TYPE IF EXISTS "message_direction_enum"`);
  }
}

