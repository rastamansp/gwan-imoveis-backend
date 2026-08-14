import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * O tour virtual deixa de ser uma foto única por imóvel e passa a ser um
 * conjunto de cenas conectadas por hotspots.
 *
 * As colunas tourImageUrl/tourImagePath de `properties` viram a primeira cena
 * ("Ambiente principal") e são removidas — manter as duas representações criaria
 * duas fontes de verdade para a mesma informação.
 */
export class CreatePropertyTourScenes1779000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "property_tour_scenes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "propertyId" uuid NOT NULL,
        "name" varchar(120) NOT NULL,
        "imageUrl" varchar(500) NOT NULL,
        "imagePath" varchar(500) NOT NULL,
        "order" int NOT NULL DEFAULT 0,
        "initialYaw" double precision NOT NULL DEFAULT 0,
        "hotspots" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_property_tour_scenes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_property_tour_scenes_property" FOREIGN KEY ("propertyId")
          REFERENCES "properties"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_tour_scenes_property"
        ON "property_tour_scenes" ("propertyId", "order");
    `);

    // Preserva tours de foto única já cadastrados, se a coluna ainda existir.
    const hasLegacyColumn = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'properties' AND column_name = 'tourImageUrl';
    `);

    if (hasLegacyColumn.length > 0) {
      await queryRunner.query(`
        INSERT INTO "property_tour_scenes" ("propertyId", "name", "imageUrl", "imagePath", "order")
        SELECT "id", 'Ambiente principal', "tourImageUrl", COALESCE("tourImagePath", ''), 0
        FROM "properties"
        WHERE "tourImageUrl" IS NOT NULL AND "tourImageUrl" <> '';
      `);

      await queryRunner.query(`
        ALTER TABLE "properties"
        DROP COLUMN IF EXISTS "tourImageUrl",
        DROP COLUMN IF EXISTS "tourImagePath";
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "tourImageUrl" varchar(500),
      ADD COLUMN IF NOT EXISTS "tourImagePath" varchar(500);
    `);

    // Devolve a cena de entrada de cada imóvel para as colunas antigas.
    await queryRunner.query(`
      UPDATE "properties" p
      SET "tourImageUrl" = s."imageUrl", "tourImagePath" = s."imagePath"
      FROM (
        SELECT DISTINCT ON ("propertyId") "propertyId", "imageUrl", "imagePath"
        FROM "property_tour_scenes"
        ORDER BY "propertyId", "order" ASC
      ) s
      WHERE s."propertyId" = p."id";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "property_tour_scenes";`);
  }
}
