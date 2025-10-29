import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventCode1730000000005 implements MigrationInterface {
  name = 'AddEventCode1730000000005'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Adicionar coluna como nullable
    await queryRunner.query(`ALTER TABLE "events" ADD COLUMN "code" varchar(16)`);

    // 2) Backfill de códigos únicos
    const rows: Array<{ id: string }> = await queryRunner.query(`SELECT id FROM "events"`);
    const used = new Set<string>();
    const gen = (): string => {
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let rand = '';
      for (let i = 0; i < 6; i++) rand += alphabet[Math.floor(Math.random() * alphabet.length)];
      return `EVT-${rand}`;
    };
    for (const r of rows) {
      let code = gen();
      let guard = 0;
      while (used.has(code) && guard < 20) { code = gen(); guard++; }
      used.add(code);
      await queryRunner.query(`UPDATE "events" SET "code" = $1 WHERE "id" = $2`, [code, r.id]);
    }

    // 3) Tornar NOT NULL e adicionar índice único
    await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "code" SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_events_code" ON "events" ("code")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_code"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "code"`);
  }
}


