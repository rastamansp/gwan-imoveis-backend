import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePayments1730000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ticketId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'method',
            type: 'enum',
            enum: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'],
            default: "'PENDING'",
          },
          {
            name: 'pixCode',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'qrCodeImage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'transactionId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'externalTransactionId',
            type: 'varchar',
            length: '255',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_PAYMENTS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_PAYMENTS_TICKET_ID',
        columnNames: ['ticketId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_PAYMENTS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_PAYMENTS_METHOD',
        columnNames: ['method'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_PAYMENTS_EXTERNAL_TRANSACTION_ID',
        columnNames: ['externalTransactionId'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['ticketId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tickets',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments');
  }
}
