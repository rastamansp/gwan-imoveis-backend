import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTicketCategories1730000000001 implements MigrationInterface {
  name = 'CreateTicketCategories1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ticket_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "price" numeric(10,2) NOT NULL DEFAULT '0',
        "maxQuantity" integer NOT NULL,
        "soldQuantity" integer NOT NULL DEFAULT '0',
        "benefits" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_categories_eventId" ON "ticket_categories" ("eventId")
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_categories" 
      ADD CONSTRAINT "FK_ticket_categories_eventId" 
      FOREIGN KEY ("eventId") 
      REFERENCES "events"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ticket_categories" 
      DROP CONSTRAINT "FK_ticket_categories_eventId"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_ticket_categories_eventId"
    `);

    await queryRunner.query(`
      DROP TABLE "ticket_categories"
    `);
  }
}
