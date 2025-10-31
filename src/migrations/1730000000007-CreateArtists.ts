import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateArtists1730000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela artists
    await queryRunner.createTable(
      new Table({
        name: 'artists',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'artistic_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nome artístico do artista',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nome completo do artista',
          },
          {
            name: 'birth_date',
            type: 'date',
            isNullable: true,
            comment: 'Data de nascimento',
          },
          {
            name: 'biography',
            type: 'text',
            isNullable: true,
            comment: 'Biografia do artista',
          },
          {
            name: 'instagram_username',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome de usuário do Instagram',
          },
          {
            name: 'youtube_username',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome de usuário do YouTube',
          },
          {
            name: 'x_username',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome de usuário do X (Twitter)',
          },
          {
            name: 'spotify_username',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome de usuário do Spotify',
          },
          {
            name: 'site_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'URL completa do site do artista',
          },
          {
            name: 'tiktok_username',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome de usuário do TikTok',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Criar índices para artists
    await queryRunner.createIndex(
      'artists',
      new TableIndex({
        name: 'IDX_artists_artistic_name',
        columnNames: ['artistic_name'],
      }),
    );

    await queryRunner.createIndex(
      'artists',
      new TableIndex({
        name: 'IDX_artists_name',
        columnNames: ['name'],
      }),
    );

    // Criar tabela event_artists (relacionamento N:N)
    await queryRunner.createTable(
      new Table({
        name: 'event_artists',
        columns: [
          {
            name: 'event_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'artist_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    // Criar foreign keys para event_artists
    await queryRunner.createForeignKey(
      'event_artists',
      new TableForeignKey({
        columnNames: ['event_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        onDelete: 'CASCADE',
        name: 'FK_event_artists_event_id',
      }),
    );

    await queryRunner.createForeignKey(
      'event_artists',
      new TableForeignKey({
        columnNames: ['artist_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'artists',
        onDelete: 'CASCADE',
        name: 'FK_event_artists_artist_id',
      }),
    );

    // Criar índices para event_artists
    await queryRunner.createIndex(
      'event_artists',
      new TableIndex({
        name: 'IDX_event_artists_event_id',
        columnNames: ['event_id'],
      }),
    );

    await queryRunner.createIndex(
      'event_artists',
      new TableIndex({
        name: 'IDX_event_artists_artist_id',
        columnNames: ['artist_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices de event_artists
    await queryRunner.dropIndex('event_artists', 'IDX_event_artists_artist_id');
    await queryRunner.dropIndex('event_artists', 'IDX_event_artists_event_id');

    // Remover foreign keys de event_artists
    await queryRunner.dropForeignKey('event_artists', 'FK_event_artists_artist_id');
    await queryRunner.dropForeignKey('event_artists', 'FK_event_artists_event_id');

    // Remover tabela event_artists
    await queryRunner.dropTable('event_artists');

    // Remover índices de artists
    await queryRunner.dropIndex('artists', 'IDX_artists_name');
    await queryRunner.dropIndex('artists', 'IDX_artists_artistic_name');

    // Remover tabela artists
    await queryRunner.dropTable('artists');
  }
}

