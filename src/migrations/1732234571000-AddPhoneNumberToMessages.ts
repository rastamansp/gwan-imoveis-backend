import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddPhoneNumberToMessages1732234571000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna phone_number
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'phoneNumber',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    // Criar índice para phoneNumber
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_phoneNumber',
        columnNames: ['phoneNumber'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índice
    await queryRunner.dropIndex('messages', 'IDX_messages_phoneNumber');

    // Remover coluna
    await queryRunner.dropColumn('messages', 'phoneNumber');
  }
}

