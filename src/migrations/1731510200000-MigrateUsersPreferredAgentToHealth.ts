import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateUsersPreferredAgentToHealth1731510200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Obter IDs dos agentes de saúde e eventos
    const healthResult = await queryRunner.query(
      `SELECT id FROM agents WHERE slug = 'health' LIMIT 1`,
    );
    const eventsResult = await queryRunner.query(
      `SELECT id FROM agents WHERE slug = 'events' LIMIT 1`,
    );

    if (!healthResult?.length) {
      // Se o agente de saúde não existir, não há o que migrar
      console.log('[AgentMigration] Agente health não encontrado, nenhuma migração aplicada.');
      return;
    }

    const healthId = healthResult[0].id;
    const eventsId = eventsResult?.[0]?.id || null;

    console.log('[AgentMigration] Migrando usuários para agente health como padrão', {
      healthId,
      eventsId,
    });

    // Atualizar usuários que estão sem preferredAgentId ou com agente events
    if (eventsId) {
      await queryRunner.query(
        `
        UPDATE users
        SET "preferredAgentId" = $1
        WHERE "preferredAgentId" IS NULL OR "preferredAgentId" = $2
        `,
        [healthId, eventsId],
      );
    } else {
      await queryRunner.query(
        `
        UPDATE users
        SET "preferredAgentId" = $1
        WHERE "preferredAgentId" IS NULL
        `,
        [healthId],
      );
    }
  }

  // Down simples: não tenta restaurar o estado anterior
  public async down(): Promise<void> {
    // Intencionalmente vazio para evitar sobrescrever preferências atuais dos usuários
  }
}


