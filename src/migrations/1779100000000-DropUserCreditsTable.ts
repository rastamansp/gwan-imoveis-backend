import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Derruba a tabela órfã `user_credits`.
 *
 * A F13 (créditos de usuário) foi removida do produto em 2026-06-30 (commit
 * `405eaf8`): era resquício de um projeto base, sem relação com o modelo de
 * negócio do Imóveis. Entidade, repositório e use cases foram apagados na época,
 * mas a tabela ficou — não houve migration de DROP. Desde então ela é uma tabela
 * sem leitor e sem escritor, que confunde quem chega e carrega coluna de saldo
 * ligada a `userId` sem nenhuma finalidade.
 *
 * A contagem é registrada no log ANTES do drop. Não abortamos se houver linhas:
 * a decisão de remover foi tomada em junho, e a verificação em produção
 * (2026-09-04) devolveu zero. Mas apagar em silêncio é diferente de apagar — se
 * um dia isto rodar num banco com dados, o total fica no log.
 */
export class DropUserCreditsTable1779100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('user_credits');
    if (!exists) {
      return;
    }

    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*)::int AS count FROM "user_credits"`,
    );

    console.log(
      `[DropUserCreditsTable] Removendo tabela órfã user_credits com ${count} linha(s). ` +
        'Feature F13 removida do código em 2026-06-30.',
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "user_credits"`);
  }

  /**
   * Recria a **estrutura**, nunca os dados — que não têm de onde voltar. Existe
   * para manter a migration reversível como as demais, não para desfazer de
   * verdade a remoção da feature.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('user_credits');
    if (exists) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "user_credits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "balance" numeric(10,2) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_credits" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_credits_userId" ON "user_credits" ("userId")`,
    );
  }
}
