import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fila persistente de transcrição de áudio do WhatsApp (F18).
 *
 * O `messageId` é UNIQUE de propósito: reentrega de webhook é comportamento
 * normal da Evolution, e sem a restrição o mesmo áudio seria transcrito e
 * respondido duas vezes ao cliente. A garantia fica no schema, não num `if` —
 * duas instâncias da API não coordenam entre si, o banco sim.
 */
export class CreateWhatsappAudioTranscriptions1779200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "whatsapp_audio_transcriptions_status_enum" AS ENUM
          ('PENDING', 'DONE', 'FAILED', 'EXPIRED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "whatsapp_audio_transcriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "messageId" varchar(255) NOT NULL,
        "conversationId" uuid,
        "phoneNumber" varchar(64),
        "instanceName" varchar(255) NOT NULL,
        "remoteJid" varchar(255) NOT NULL,
        "userId" uuid,
        "audio" bytea,
        "mimeType" varchar(120),
        "sizeBytes" integer NOT NULL DEFAULT 0,
        "status" "whatsapp_audio_transcriptions_status_enum" NOT NULL DEFAULT 'PENDING',
        "attempts" integer NOT NULL DEFAULT 0,
        "nextAttemptAt" TIMESTAMPTZ,
        "transcribedText" text,
        "lastError" varchar(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_whatsapp_audio_transcriptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_whatsapp_audio_transcriptions_messageId" UNIQUE ("messageId")
      )
    `);

    // O reconciliador varre exatamente por (status, nextAttemptAt).
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_whatsapp_audio_transcriptions_pending"
        ON "whatsapp_audio_transcriptions" ("status", "nextAttemptAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_whatsapp_audio_transcriptions_pending"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "whatsapp_audio_transcriptions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "whatsapp_audio_transcriptions_status_enum"`,
    );
  }
}
