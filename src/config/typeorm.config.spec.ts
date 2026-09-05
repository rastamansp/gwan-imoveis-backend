import { getTypeOrmConfig } from './typeorm.config';

/**
 * `synchronize` desligado (change OpenSpec `disable-typeorm-synchronize`).
 *
 * Este teste existe porque a configuração anterior **parecia segura e não era**:
 * `NODE_ENV !== 'production'` dá a impressão de que produção está protegida, mas
 * transforma uma variável de ambiente na única coisa entre o boot e apagar os
 * embeddings de todos os imóveis.
 *
 * Medido em 2026-09-05, em desenvolvimento: duas colunas `vector` antes do boot,
 * zero depois. O `synchronize` remove o que as entidades não declaram, e as
 * colunas pgvector não podem ser declaradas — o TypeORM não modela o tipo.
 *
 * Sem um teste, a decisão dura até alguém achar cômodo religar "só em dev".
 */

const config = (env: Record<string, string | undefined>) =>
  getTypeOrmConfig({ get: (k: string) => env[k] } as any) as any;

describe('typeorm.config — synchronize', () => {
  const AMBIENTES = ['production', 'development', 'test', 'staging', ''];

  it.each(AMBIENTES)('fica desligado com NODE_ENV=%s', (nodeEnv) => {
    expect(config({ NODE_ENV: nodeEnv }).synchronize).toBe(false);
  });

  /**
   * O caso que a configuração antiga tratava como "desenvolvimento": variável
   * ausente. Era exatamente aqui que produção se tornaria destrutiva se o deploy
   * esquecesse a env.
   */
  it('fica desligado quando NODE_ENV não está definido', () => {
    expect(config({}).synchronize).toBe(false);
  });

  it('não depende de NODE_ENV para decidir', () => {
    const valores = AMBIENTES.map((e) => config({ NODE_ENV: e }).synchronize);
    expect(new Set(valores).size).toBe(1);
  });

  it('as migrations continuam declaradas — elas são a fonte do schema', () => {
    expect(config({ NODE_ENV: 'development' }).migrations).toBeDefined();
    expect(String(config({ NODE_ENV: 'development' }).migrations)).toContain('migrations');
  });
});
