import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddChannelToMessages1732280000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna channel na tabela messages
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'channel',
        type: 'enum',
        enum: ['WEB', 'WHATSAPP'],
        isNullable: true,
        comment: 'Canal de comunicação usado para enviar/receber mensagem',
      }),
    );

    // Criar índice para canal
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_channel" ON "messages" ("channel")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_messages_channel"
    `);

    // Remover coluna
    await queryRunner.dropColumn('messages', 'channel');
  }
}

