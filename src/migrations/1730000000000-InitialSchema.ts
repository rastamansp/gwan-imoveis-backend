import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1730000000000 implements MigrationInterface {
  name = 'InitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "phone" character varying(20),
        "role" character varying NOT NULL DEFAULT 'USER',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Criar tabela events
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "location" character varying(255) NOT NULL,
        "address" character varying(255) NOT NULL,
        "city" character varying(100) NOT NULL,
        "state" character varying(2) NOT NULL,
        "image" character varying(500) NOT NULL,
        "category" character varying(100) NOT NULL,
        "organizerId" uuid NOT NULL,
        "organizerName" character varying(255) NOT NULL,
        "status" character varying NOT NULL DEFAULT 'ACTIVE',
        "maxCapacity" integer NOT NULL DEFAULT '0',
        "soldTickets" integer NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id")
      )
    `);

    // Criar índices
    await queryRunner.query(`CREATE INDEX "IDX_events_organizerId" ON "events" ("organizerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_events_status" ON "events" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_events_status"`);
    await queryRunner.query(`DROP INDEX "IDX_events_organizerId"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
