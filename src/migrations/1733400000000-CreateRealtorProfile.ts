import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRealtorProfile1733400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('realtor_profiles');

    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'realtor_profiles',
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
            },
            {
              name: 'nomeFantasia',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'nomeContato',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'telefone',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'instagram',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'facebook',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'linkedin',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'whatsappBusiness',
              type: 'varchar',
              length: '20',
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

      // Criar foreign key
      await queryRunner.createForeignKey(
        'realtor_profiles',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );

      // Criar índice único em userId
      await queryRunner.createIndex(
        'realtor_profiles',
        new TableIndex({
          name: 'IDX_realtor_profiles_userId',
          columnNames: ['userId'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('realtor_profiles');

    if (tableExists) {
      await queryRunner.dropTable('realtor_profiles');
    }
  }
}

