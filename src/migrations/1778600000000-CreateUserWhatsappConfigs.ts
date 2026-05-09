import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateUserWhatsappConfigs1778600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('user_whatsapp_configs');

    if (tableExists) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'user_whatsapp_configs',
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'evolutionInstanceId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'evolutionInstanceName',
            type: 'varchar',
            length: '64',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_whatsapp_configs',
      new TableForeignKey({
        name: 'fk_user_whatsapp_configs_user',
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'user_whatsapp_configs',
      new TableIndex({
        name: 'idx_user_whatsapp_configs_user',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('user_whatsapp_configs');
    if (tableExists) {
      await queryRunner.dropTable('user_whatsapp_configs');
    }
  }
}
