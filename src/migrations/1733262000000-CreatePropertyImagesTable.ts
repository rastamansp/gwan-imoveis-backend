import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePropertyImagesTable1733262000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna coverImageUrl na tabela properties
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN IF NOT EXISTS "coverImageUrl" VARCHAR(500) NULL;
    `);

    // Verificar se a tabela já existe
    const tableExists = await queryRunner.hasTable('property_images');
    
    if (tableExists) {
      // Se a tabela já existe, apenas adicionar colunas que faltam
      const table = await queryRunner.getTable('property_images');
      
      if (!table?.findColumnByName('filePath')) {
        await queryRunner.query(`
          ALTER TABLE "property_images" 
          ADD COLUMN IF NOT EXISTS "filePath" VARCHAR(500) NULL;
        `);
      }
      
      if (!table?.findColumnByName('thumbnailPath')) {
        await queryRunner.query(`
          ALTER TABLE "property_images" 
          ADD COLUMN IF NOT EXISTS "thumbnailPath" VARCHAR(500) NULL;
        `);
      }
      
      return; // Tabela já existe, não precisa criar novamente
    }

    // Criar tabela property_images
    await queryRunner.createTable(
      new Table({
        name: 'property_images',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'propertyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'thumbnailUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'filePath',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'thumbnailPath',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'isCover',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Criar foreign key para properties (se não existir)
    const table = await queryRunner.getTable('property_images');
    const foreignKeyExists = table?.foreignKeys.some(
      fk => fk.columnNames.includes('propertyId') && fk.referencedTableName === 'properties'
    );

    if (!foreignKeyExists) {
      await queryRunner.createForeignKey(
        'property_images',
        new TableForeignKey({
          columnNames: ['propertyId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'properties',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_images_propertyId" ON "property_images" ("propertyId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_images_isCover" ON "property_images" ("isCover");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_images_order" ON "property_images" ("order");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_images_order";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_images_isCover";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_images_propertyId";`);

    // Remover tabela property_images
    await queryRunner.dropTable('property_images', true);

    // Remover coluna coverImageUrl da tabela properties
    await queryRunner.query(`
      ALTER TABLE "properties" 
      DROP COLUMN IF EXISTS "coverImageUrl";
    `);
  }
}

