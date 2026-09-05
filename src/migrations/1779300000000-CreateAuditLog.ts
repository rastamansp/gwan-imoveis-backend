import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Trilha de auditoria append-only (F19).
 *
 * A imutabilidade fica numa **trigger**, não num `if` da aplicação. O motivo é
 * simples: duas instâncias da API não coordenam entre si, o banco sim — e uma
 * trilha que o próprio sistema consegue reescrever não serve como evidência.
 * Mesmo padrão que o `gwan-watt` usa no ledger de créditos.
 *
 * A política de retenção **precisa ser decidida antes de a tabela crescer**;
 * está registrada na spec da F19, não aqui, porque é decisão de produto.
 */
export class CreateAuditLog1779300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "audit_log_action_enum" AS ENUM (
          'PROPERTY_CREATED', 'PROPERTY_UPDATED', 'PROPERTY_DELETED',
          'PROPERTY_IMAGE_DELETED', 'TOUR_SCENE_DELETED',
          'USER_PROMOTED', 'LOGIN_SUCCEEDED', 'LOGIN_FAILED',
          'CONVERSATION_ASSIGNED', 'CONVERSATION_CLOSED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actorId" uuid,
        "actorRole" varchar(32),
        "action" "audit_log_action_enum" NOT NULL,
        "entityType" varchar(64) NOT NULL,
        "entityId" varchar(128),
        "ip" varchar(64),
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_actor"
        ON "audit_log" ("actorId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_entity"
        ON "audit_log" ("entityType", "entityId")
    `);

    // A garantia que faz a trilha valer alguma coisa.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "audit_log_is_append_only"()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'audit_log e append-only: % nao e permitido', TG_OP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_audit_log_append_only" ON "audit_log"`);
    await queryRunner.query(`
      CREATE TRIGGER "trg_audit_log_append_only"
      BEFORE UPDATE OR DELETE ON "audit_log"
      FOR EACH ROW EXECUTE FUNCTION "audit_log_is_append_only"();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // A trigger sai primeiro: com ela de pé, nem o DROP TABLE de uma tabela com
    // linhas passaria sem ruído em alguns caminhos.
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_audit_log_append_only" ON "audit_log"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS "audit_log_is_append_only"()`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_actor"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_log_action_enum"`);
  }
}
