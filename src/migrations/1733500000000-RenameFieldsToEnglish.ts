import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameFieldsToEnglish1733500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename Property table columns
    const propertyTable = await queryRunner.getTable('properties');
    
    if (propertyTable) {
      // Rename amenities columns
      if (propertyTable.findColumnByName('piscina')) {
        await queryRunner.renameColumn('properties', 'piscina', 'hasPool');
      }
      if (propertyTable.findColumnByName('hidromassagem')) {
        await queryRunner.renameColumn('properties', 'hidromassagem', 'hasJacuzzi');
      }
      if (propertyTable.findColumnByName('frenteMar')) {
        await queryRunner.renameColumn('properties', 'frenteMar', 'oceanFront');
      }
      if (propertyTable.findColumnByName('jardim')) {
        await queryRunner.renameColumn('properties', 'jardim', 'hasGarden');
      }
      if (propertyTable.findColumnByName('areaGourmet')) {
        await queryRunner.renameColumn('properties', 'areaGourmet', 'hasGourmetArea');
      }
      if (propertyTable.findColumnByName('mobiliado')) {
        await queryRunner.renameColumn('properties', 'mobiliado', 'furnished');
      }
      
      // Rename realtor relationship column
      if (propertyTable.findColumnByName('corretorId')) {
        // First, drop the foreign key constraint if it exists
        const foreignKeys = propertyTable.foreignKeys.filter(
          (fk) => fk.columnNames.includes('corretorId'),
        );
        
        for (const fk of foreignKeys) {
          await queryRunner.dropForeignKey('properties', fk);
        }
        
        // Rename the column
        await queryRunner.renameColumn('properties', 'corretorId', 'realtorId');
        
        // Recreate the foreign key with new name
        await queryRunner.createForeignKey('properties', {
          columnNames: ['realtorId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        });
      }
    }

    // Rename RealtorProfile table columns
    const realtorProfileTable = await queryRunner.getTable('realtor_profiles');
    
    if (realtorProfileTable) {
      if (realtorProfileTable.findColumnByName('nomeFantasia')) {
        await queryRunner.renameColumn('realtor_profiles', 'nomeFantasia', 'businessName');
      }
      if (realtorProfileTable.findColumnByName('nomeContato')) {
        await queryRunner.renameColumn('realtor_profiles', 'nomeContato', 'contactName');
      }
      if (realtorProfileTable.findColumnByName('telefone')) {
        await queryRunner.renameColumn('realtor_profiles', 'telefone', 'phone');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Property table columns
    const propertyTable = await queryRunner.getTable('properties');
    
    if (propertyTable) {
      if (propertyTable.findColumnByName('hasPool')) {
        await queryRunner.renameColumn('properties', 'hasPool', 'piscina');
      }
      if (propertyTable.findColumnByName('hasJacuzzi')) {
        await queryRunner.renameColumn('properties', 'hasJacuzzi', 'hidromassagem');
      }
      if (propertyTable.findColumnByName('oceanFront')) {
        await queryRunner.renameColumn('properties', 'oceanFront', 'frenteMar');
      }
      if (propertyTable.findColumnByName('hasGarden')) {
        await queryRunner.renameColumn('properties', 'hasGarden', 'jardim');
      }
      if (propertyTable.findColumnByName('hasGourmetArea')) {
        await queryRunner.renameColumn('properties', 'hasGourmetArea', 'areaGourmet');
      }
      if (propertyTable.findColumnByName('furnished')) {
        await queryRunner.renameColumn('properties', 'furnished', 'mobiliado');
      }
      
      if (propertyTable.findColumnByName('realtorId')) {
        const foreignKeys = propertyTable.foreignKeys.filter(
          (fk) => fk.columnNames.includes('realtorId'),
        );
        
        for (const fk of foreignKeys) {
          await queryRunner.dropForeignKey('properties', fk);
        }
        
        await queryRunner.renameColumn('properties', 'realtorId', 'corretorId');
        
        await queryRunner.createForeignKey('properties', {
          columnNames: ['corretorId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        });
      }
    }

    // Revert RealtorProfile table columns
    const realtorProfileTable = await queryRunner.getTable('realtor_profiles');
    
    if (realtorProfileTable) {
      if (realtorProfileTable.findColumnByName('businessName')) {
        await queryRunner.renameColumn('realtor_profiles', 'businessName', 'nomeFantasia');
      }
      if (realtorProfileTable.findColumnByName('contactName')) {
        await queryRunner.renameColumn('realtor_profiles', 'contactName', 'nomeContato');
      }
      if (realtorProfileTable.findColumnByName('phone')) {
        await queryRunner.renameColumn('realtor_profiles', 'phone', 'telefone');
      }
    }
  }
}

