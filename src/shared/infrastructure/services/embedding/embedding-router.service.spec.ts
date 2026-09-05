import { EmbeddingRouterService } from './embedding-router.service';

/**
 * Cache do embedding de consulta (change OpenSpec `add-embedding-query-cache`).
 *
 * O teste que mais importa aqui é o da **chave**: provider e modelo precisam
 * fazer parte dela. Voyage devolve 512 dimensões e OpenAI 1536, e servir o vetor
 * do provider errado não gera erro em lugar nenhum — gera resultado de busca
 * silenciosamente incorreto. É o único jeito de esta change causar dano.
 */

class FakeProvider {
  calls: string[] = [];
  constructor(
    private readonly name: 'voyage' | 'openai',
    private readonly model: string,
    private readonly dim: number,
  ) {}
  getProviderName() {
    return this.name;
  }
  getModel() {
    return this.model;
  }
  getDimension() {
    return this.dim;
  }
  isConfigured() {
    return true;
  }
  async generate(text: string) {
    this.calls.push(text);
    return {
      vector: new Array(this.dim).fill(0.1),
      provider: this.name,
      model: this.model,
      dimension: this.dim,
    };
  }
}

class FakeCache {
  store = new Map<string, unknown>();
  failGet = false;
  failSet = false;
  lastTtlMs?: number;

  async get<T>(key: string): Promise<T | undefined> {
    if (this.failGet) throw new Error('redis fora');
    return this.store.get(key) as T | undefined;
  }
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (this.failSet) throw new Error('redis fora');
    this.lastTtlMs = ttl;
    this.store.set(key, value);
  }
}

const config = (values: Record<string, string> = {}) => ({
  get: (k: string) => values[k],
});

describe('EmbeddingRouterService — cache da consulta', () => {
  let voyage: FakeProvider;
  let openai: FakeProvider;
  let cache: FakeCache;

  const build = (env: Record<string, string> = {}, withCache = true) => {
    voyage = new FakeProvider('voyage', 'voyage-3-lite', 512);
    openai = new FakeProvider('openai', 'text-embedding-3-small', 1536);
    cache = new FakeCache();
    return new EmbeddingRouterService(
      config(env) as any,
      voyage as any,
      openai as any,
      withCache ? (cache as any) : undefined,
    );
  };

  it('a segunda consulta idêntica não chama o provider', async () => {
    const router = build();
    await router.generateEmbeddingDetailed('casa com piscina', 'query');
    await router.generateEmbeddingDetailed('casa com piscina', 'query');
    expect(voyage.calls).toHaveLength(1);
  });

  it('consultas diferentes chamam o provider', async () => {
    const router = build();
    await router.generateEmbeddingDetailed('casa com piscina', 'query');
    await router.generateEmbeddingDetailed('apartamento frente ao mar', 'query');
    expect(voyage.calls).toHaveLength(2);
  });

  it.each([
    ['espaços nas bordas', '  casa com piscina  '],
    ['caixa diferente', 'CASA COM PISCINA'],
    ['espaços internos repetidos', 'casa   com    piscina'],
  ])('compartilha a chave quando difere só em %s', async (_label, variante) => {
    const router = build();
    await router.generateEmbeddingDetailed('casa com piscina', 'query');
    await router.generateEmbeddingDetailed(variante, 'query');
    expect(voyage.calls).toHaveLength(1);
  });

  /**
   * A normalização é conservadora de propósito: remover acento mudaria o vetor,
   * e o cache passaria a responder uma pergunta diferente da que foi feita.
   */
  it('não normaliza acento — texto acentuado é outra consulta', async () => {
    const router = build();
    await router.generateEmbeddingDetailed('sao sebastiao', 'query');
    await router.generateEmbeddingDetailed('são sebastião', 'query');
    expect(voyage.calls).toHaveLength(2);
  });

  /**
   * O teste que impede o vetor de dimensão errada de ser servido.
   */
  it('trocar de provider produz chave diferente', async () => {
    const comVoyage = build({ EMBEDDING_PROVIDER: 'voyage' });
    await comVoyage.generateEmbeddingDetailed('casa com piscina', 'query');
    const chavesVoyage = [...cache.store.keys()];

    const comOpenai = build({ EMBEDDING_PROVIDER: 'openai' });
    await comOpenai.generateEmbeddingDetailed('casa com piscina', 'query');
    const chavesOpenai = [...cache.store.keys()];

    expect(chavesVoyage[0]).not.toBe(chavesOpenai[0]);
    expect(chavesVoyage[0]).toContain('voyage');
    expect(chavesOpenai[0]).toContain('openai');
  });

  it('a chave carrega o modelo, não só o provider', async () => {
    const router = build();
    await router.generateEmbeddingDetailed('casa', 'query');
    expect([...cache.store.keys()][0]).toContain('voyage-3-lite');
  });

  /**
   * Embedding de imóvel já é persistido no PostgreSQL. Cacheá-lo guardaria o
   * mesmo dado duas vezes e encheria o Redis com o que já tem dono.
   */
  it('não cacheia embedding de documento', async () => {
    const router = build();
    await router.generateEmbeddingDetailed('descrição do imóvel', 'document');
    await router.generateEmbeddingDetailed('descrição do imóvel', 'document');
    expect(voyage.calls).toHaveLength(2);
    expect(cache.store.size).toBe(0);
  });

  it('generateEmbedding (documento) também passa direto', async () => {
    const router = build();
    await router.generateEmbedding('descrição');
    expect(cache.store.size).toBe(0);
  });

  describe('degradação', () => {
    it('falha de leitura no Redis não quebra a busca', async () => {
      const router = build();
      cache.failGet = true;
      const result = await router.generateEmbeddingDetailed('casa', 'query');
      expect(result.vector).toHaveLength(512);
      expect(voyage.calls).toHaveLength(1);
    });

    it('falha de escrita no Redis não quebra a busca', async () => {
      const router = build();
      cache.failSet = true;
      const result = await router.generateEmbeddingDetailed('casa', 'query');
      expect(result.vector).toHaveLength(512);
    });

    it('sem cache configurado, funciona igual', async () => {
      const router = build({}, false);
      const result = await router.generateEmbeddingDetailed('casa', 'query');
      expect(result.vector).toHaveLength(512);
      expect(router.cacheStats().enabled).toBe(false);
    });

    /**
     * O Redis da P0 é `allkeys-lru`: a chave pode desaparecer a qualquer momento
     * e isso é caso normal, não erro.
     */
    it('chave despejada apenas gera nova chamada', async () => {
      const router = build();
      await router.generateEmbeddingDetailed('casa', 'query');
      cache.store.clear();
      await router.generateEmbeddingDetailed('casa', 'query');
      expect(voyage.calls).toHaveLength(2);
    });
  });

  describe('TTL', () => {
    it('usa uma hora por default', async () => {
      const router = build();
      await router.generateEmbeddingDetailed('casa', 'query');
      expect(cache.lastTtlMs).toBe(3600 * 1000);
    });

    it('respeita a variável de ambiente', async () => {
      const router = build({ EMBEDDING_CACHE_TTL_SECONDS: '60' });
      await router.generateEmbeddingDetailed('casa', 'query');
      expect(cache.lastTtlMs).toBe(60 * 1000);
    });

    it.each([['inválida', 'abc'], ['zero', '0'], ['negativa', '-10']])(
      'ignora TTL %s e mantém o default',
      async (_label, valor) => {
        const router = build({ EMBEDDING_CACHE_TTL_SECONDS: valor });
        await router.generateEmbeddingDetailed('casa', 'query');
        expect(cache.lastTtlMs).toBe(3600 * 1000);
      },
    );
  });

  describe('observabilidade', () => {
    it('conta acertos e erros', async () => {
      const router = build();
      await router.generateEmbeddingDetailed('casa', 'query');
      await router.generateEmbeddingDetailed('casa', 'query');
      await router.generateEmbeddingDetailed('apartamento', 'query');

      expect(router.cacheStats()).toMatchObject({ hits: 1, misses: 2 });
    });

    it('a taxa de acerto não expõe o texto da consulta', async () => {
      const router = build();
      await router.generateEmbeddingDetailed('quero casa na praia de maresias', 'query');
      await router.generateEmbeddingDetailed('quero casa na praia de maresias', 'query');

      expect(router.hitRate()).not.toContain('maresias');
      expect(router.hitRate()).toContain('%');
    });

    it('sem amostras, reporta isso em vez de dividir por zero', () => {
      expect(build().hitRate()).toBe('sem amostras');
    });
  });
});
