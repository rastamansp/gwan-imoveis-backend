import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyEmbedding1778500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "embeddingVoyage" vector(512),
      ADD COLUMN IF NOT EXISTS "embeddingVoyageModel" varchar(64),
      ADD COLUMN IF NOT EXISTS "embeddingVoyageUpdatedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "embeddingOpenai" vector(1536),
      ADD COLUMN IF NOT EXISTS "embeddingOpenaiModel" varchar(64),
      ADD COLUMN IF NOT EXISTS "embeddingOpenaiUpdatedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "embeddingChunk" text;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_properties_embedding_voyage_hnsw"
      ON "properties" USING hnsw ("embeddingVoyage" vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_properties_embedding_openai_hnsw"
      ON "properties" USING hnsw ("embeddingOpenai" vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_embedding_openai_hnsw";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_embedding_voyage_hnsw";`);
    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "embeddingChunk",
      DROP COLUMN IF EXISTS "embeddingOpenaiUpdatedAt",
      DROP COLUMN IF EXISTS "embeddingOpenaiModel",
      DROP COLUMN IF EXISTS "embeddingOpenai",
      DROP COLUMN IF EXISTS "embeddingVoyageUpdatedAt",
      DROP COLUMN IF EXISTS "embeddingVoyageModel",
      DROP COLUMN IF EXISTS "embeddingVoyage";
    `);
  }
}
