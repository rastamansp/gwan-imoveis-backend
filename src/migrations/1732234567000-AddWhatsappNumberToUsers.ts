import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWhatsappNumberToUsers1732234567000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'whatsappNumber',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'whatsappNumber');
  }
}

