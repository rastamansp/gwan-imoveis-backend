import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRagFieldsToArtists1730000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna metadata (jsonb)
    await queryRunner.addColumn(
      'artists',
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
        comment: 'Metadados completos do artista em formato JSON (artista + eventos vinculados)',
      }),
    );

    // Adicionar coluna embedding (array de floats) - usando text e convertendo para real[]
    await queryRunner.query(`
      ALTER TABLE "artists" 
      ADD COLUMN "embedding" real[] NULL;
      COMMENT ON COLUMN "artists"."embedding" IS 'Embedding vetorial do texto consolidado para busca RAG';
    `);

    // Adicionar coluna embedding_model
    await queryRunner.addColumn(
      'artists',
      new TableColumn({
        name: 'embedding_model',
        type: 'varchar',
        length: '100',
        isNullable: true,
        default: "'text-embedding-3-small'",
        comment: 'Modelo usado para gerar o embedding',
      }),
    );

    // Criar índice GIN para metadata (otimização de buscas JSONB)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_artists_metadata" ON "artists" USING GIN ("metadata");
    `);

    // Nota: Índice para embedding requer extensão pgvector
    // Para busca por similaridade, recomenda-se instalar: CREATE EXTENSION IF NOT EXISTS vector;
    // Após instalar pgvector, pode-se criar índice: CREATE INDEX ON artists USING ivfflat (embedding vector_cosine_ops);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artists_metadata"`);

    // Remover colunas
    await queryRunner.dropColumn('artists', 'embedding_model');
    await queryRunner.query(`ALTER TABLE "artists" DROP COLUMN IF EXISTS "embedding"`);
    await queryRunner.dropColumn('artists', 'metadata');
  }
}

