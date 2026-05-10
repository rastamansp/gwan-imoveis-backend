import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove o agente "health" (placeholder fantasma do canal WhatsApp).
 *
 * Reatribui qualquer referência (conversations.currentAgentId,
 * users.preferredAgentId) para o agente "corretor-imoveis", e então
 * deleta a linha do agente "health" da tabela `agents`.
 *
 * Idempotente — se nenhum dos dois agentes existir, é no-op.
 */
export class RemoveHealthAgent1778700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const healthRows = await queryRunner.query(
      `SELECT id FROM agents WHERE slug = 'health' LIMIT 1`,
    );
    if (!healthRows || healthRows.length === 0) {
      return;
    }
    const healthId = healthRows[0].id;

    const corretorRows = await queryRunner.query(
      `SELECT id FROM agents WHERE slug = 'corretor-imoveis' LIMIT 1`,
    );
    if (!corretorRows || corretorRows.length === 0) {
      // Sem destino para reatribuir — apenas zera referências em vez de quebrar FK.
      await queryRunner.query(
        `UPDATE conversations SET "currentAgentId" = NULL WHERE "currentAgentId" = $1`,
        [healthId],
      );
      await queryRunner.query(
        `UPDATE users SET "preferredAgentId" = NULL WHERE "preferredAgentId" = $1`,
        [healthId],
      );
      await queryRunner.query(`DELETE FROM agents WHERE id = $1`, [healthId]);
      return;
    }
    const corretorId = corretorRows[0].id;

    await queryRunner.query(
      `UPDATE conversations SET "currentAgentId" = $1 WHERE "currentAgentId" = $2`,
      [corretorId, healthId],
    );
    await queryRunner.query(
      `UPDATE users SET "preferredAgentId" = $1 WHERE "preferredAgentId" = $2`,
      [corretorId, healthId],
    );
    await queryRunner.query(`DELETE FROM agents WHERE id = $1`, [healthId]);
  }

  public async down(): Promise<void> {
    // Sem rollback: o agente "health" era um placeholder fantasma sem comportamento
    // diferenciado. Recriá-lo apenas reintroduziria um registro inútil.
  }
}
