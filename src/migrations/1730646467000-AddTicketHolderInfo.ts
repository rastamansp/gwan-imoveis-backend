import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTicketHolderInfo1730646467000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para tipos de documento se não existir
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "document_type_enum" AS ENUM('CPF', 'RG', 'CNH', 'PASSAPORTE', 'OUTRO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Adicionar colunas na tabela tickets
    await queryRunner.addColumn(
      'tickets',
      new TableColumn({
        name: 'holder_first_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'tickets',
      new TableColumn({
        name: 'holder_last_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Adicionar coluna document_type usando o enum criado
    await queryRunner.query(`
      ALTER TABLE tickets 
      ADD COLUMN document_type document_type_enum NULL;
    `);

    await queryRunner.addColumn(
      'tickets',
      new TableColumn({
        name: 'document_number',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover colunas
    await queryRunner.dropColumn('tickets', 'document_number');
    await queryRunner.dropColumn('tickets', 'document_type');
    await queryRunner.dropColumn('tickets', 'holder_last_name');
    await queryRunner.dropColumn('tickets', 'holder_first_name');

    // Remover enum (opcional, pode deixar para outras migrations)
    await queryRunner.query(`DROP TYPE IF EXISTS "document_type_enum"`);
  }
}

