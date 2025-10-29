import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateScanners1730000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scanners',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'apiKey',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'secretKey',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'VALIDATOR'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIVE'",
          },
          {
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastUsedIp',
            type: 'varchar',
            length: '45',
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
    await queryRunner.createIndex('scanners', new TableIndex({
      name: 'IDX_SCANNERS_API_KEY',
      columnNames: ['apiKey'],
    }));

    await queryRunner.createIndex('scanners', new TableIndex({
      name: 'IDX_SCANNERS_NAME',
      columnNames: ['name'],
    }));

    await queryRunner.createIndex('scanners', new TableIndex({
      name: 'IDX_SCANNERS_STATUS',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('scanners', new TableIndex({
      name: 'IDX_SCANNERS_ROLE',
      columnNames: ['role'],
    }));

    await queryRunner.createIndex('scanners', new TableIndex({
      name: 'IDX_SCANNERS_LOCATION',
      columnNames: ['location'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scanners');
  }
}
