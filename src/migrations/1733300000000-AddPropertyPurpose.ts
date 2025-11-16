import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPropertyPurpose1733300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const table = await queryRunner.getTable('properties');
    const hasPurposeColumn = table?.findColumnByName('purpose');

    if (!hasPurposeColumn) {
      // Criar tipo enum se não existir
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE property_purpose_enum AS ENUM ('RENT', 'SALE', 'INVESTMENT');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Adicionar coluna com valor padrão RENT
      await queryRunner.query(`
        ALTER TABLE "properties" 
        ADD COLUMN "purpose" property_purpose_enum NOT NULL DEFAULT 'RENT';
      `);

      // Atualizar registros existentes para RENT se necessário
      await queryRunner.query(`
        UPDATE properties 
        SET purpose = 'RENT' 
        WHERE purpose IS NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('properties');
    const hasPurposeColumn = table?.findColumnByName('purpose');

    if (hasPurposeColumn) {
      await queryRunner.dropColumn('properties', 'purpose');
      
      // Remover tipo enum se não houver mais referências
      await queryRunner.query(`
        DROP TYPE IF EXISTS property_purpose_enum;
      `);
    }
  }
}

