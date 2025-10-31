import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImageToArtists1730000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'artists',
      new TableColumn({
        name: 'image',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: 'URL da imagem do artista',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('artists', 'image');
  }
}

