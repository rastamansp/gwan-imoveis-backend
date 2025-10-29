import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRagFieldsToEvents1730000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna metadata (jsonb)
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
        comment: 'Metadados completos do evento em formato JSON (evento + tickets + categorias)',
      }),
    );

    // Adicionar coluna embedding (array de floats) - usando text e convertendo para real[]
    await queryRunner.query(`
      ALTER TABLE "events" 
      ADD COLUMN "embedding" real[] NULL;
      COMMENT ON COLUMN "events"."embedding" IS 'Embedding vetorial do texto consolidado para busca RAG';
    `);

    // Adicionar coluna embedding_model
    await queryRunner.addColumn(
      'events',
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
      CREATE INDEX IF NOT EXISTS "IDX_events_metadata" ON "events" USING GIN ("metadata");
    `);

    // Nota: Índice para embedding requer extensão pgvector
    // Para busca por similaridade, recomenda-se instalar: CREATE EXTENSION IF NOT EXISTS vector;
    // Após instalar pgvector, pode-se criar índice: CREATE INDEX ON events USING ivfflat (embedding vector_cosine_ops);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_metadata"`);

    // Remover colunas
    await queryRunner.dropColumn('events', 'embedding_model');
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "embedding"`);
    await queryRunner.dropColumn('events', 'metadata');
  }
}

