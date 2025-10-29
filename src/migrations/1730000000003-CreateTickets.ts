import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTickets1730000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'eventId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'categoryId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'eventTitle',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'eventDate',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'eventLocation',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'categoryName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'userName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'userEmail',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'qrCode',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'qrCodeData',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'USED', 'CANCELLED', 'TRANSFERRED'],
            default: "'ACTIVE'",
          },
          {
            name: 'purchasedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'usedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'transferredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'transferredTo',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'transferredToName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'transferredToEmail',
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
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_EVENT_ID',
        columnNames: ['eventId'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_QR_CODE',
        columnNames: ['qrCode'],
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKETS_QR_CODE_DATA',
        columnNames: ['qrCodeData'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['eventId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tickets');
  }
}
