import { AuditLogService } from './audit-log.service';
import { AuditAction } from '../../domain/entities/audit-log.entity';

/**
 * Trilha de auditoria (F19).
 *
 * Dois comportamentos concentram o valor destes testes:
 *
 * 1. **Falha ao auditar não pode derrubar a operação de negócio.** Auditoria é
 *    evidência, não invariante: perder um registro num crash é troca aceitável;
 *    apagar imóvel deixar de funcionar porque a trilha caiu, não.
 * 2. **Nada de conteúdo sensível chega ao metadata.** A trilha guarda QUE a ação
 *    aconteceu, não o que ela continha.
 */

class FakeRepository {
  saved: any[] = [];
  failOnSave = false;

  create(data: any) {
    return { ...data };
  }

  async save(entry: any) {
    if (this.failOnSave) throw new Error('banco fora');
    this.saved.push(entry);
    return entry;
  }

  createQueryBuilder() {
    const state: any = { wheres: [] };
    const qb: any = {
      andWhere: (sql: string, params: any) => {
        state.wheres.push({ sql, params });
        return qb;
      },
      orderBy: () => qb,
      skip: (n: number) => {
        state.skip = n;
        return qb;
      },
      take: (n: number) => {
        state.take = n;
        return qb;
      },
      getManyAndCount: async () => [[], 0],
      _state: state,
    };
    this.lastQb = qb;
    return qb;
  }

  lastQb: any;
}

class FakeLogger {
  entries: any[] = [];
  info(m: string, c?: any) {
    this.entries.push({ level: 'info', m, c });
  }
  warn(m: string, c?: any) {
    this.entries.push({ level: 'warn', m, c });
  }
  error(m: string, c?: any) {
    this.entries.push({ level: 'error', m, c });
  }
  debug() {}
}

/** `record` é fire-and-forget; o teste precisa deixar a microtask rodar. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('AuditLogService', () => {
  let repo: FakeRepository;
  let logger: FakeLogger;
  let service: AuditLogService;

  beforeEach(() => {
    repo = new FakeRepository();
    logger = new FakeLogger();
    service = new AuditLogService(repo as any, logger as any);
  });

  describe('registro', () => {
    it('grava a ação com ator, alvo e origem', async () => {
      service.record({
        action: AuditAction.PROPERTY_DELETED,
        entityType: 'property',
        entityId: 'prop-1',
        actorId: 'corretor-1',
        actorRole: 'CORRETOR',
        ip: '203.0.113.7',
      });
      await flush();

      expect(repo.saved[0]).toMatchObject({
        action: AuditAction.PROPERTY_DELETED,
        entityType: 'property',
        entityId: 'prop-1',
        actorId: 'corretor-1',
        actorRole: 'CORRETOR',
        ip: '203.0.113.7',
      });
    });

    it('aceita ação sem ator — login que falhou não tem ator identificado', async () => {
      service.record({ action: AuditAction.LOGIN_FAILED, entityType: 'user' });
      await flush();
      expect(repo.saved[0].actorId).toBeNull();
    });

    it('trunca campos longos em vez de estourar a coluna', async () => {
      service.record({
        action: AuditAction.PROPERTY_UPDATED,
        entityType: 'x'.repeat(200),
        entityId: 'y'.repeat(300),
        actorRole: 'z'.repeat(100),
        ip: 'w'.repeat(200),
      });
      await flush();

      expect(repo.saved[0].entityType).toHaveLength(64);
      expect(repo.saved[0].entityId).toHaveLength(128);
      expect(repo.saved[0].actorRole).toHaveLength(32);
      expect(repo.saved[0].ip).toHaveLength(64);
    });
  });

  describe('falha de auditoria não derruba o negócio', () => {
    /**
     * O ponto central. Se `record` propagasse, um defeito na trilha viraria
     * indisponibilidade do produto — apagar imóvel deixaria de funcionar porque
     * a auditoria caiu.
     */
    it('não lança quando o banco falha', async () => {
      repo.failOnSave = true;
      expect(() =>
        service.record({ action: AuditAction.PROPERTY_DELETED, entityType: 'property' }),
      ).not.toThrow();
      await flush();
    });

    it('registra a falha como erro de log, para não sumir em silêncio', async () => {
      repo.failOnSave = true;
      service.record({ action: AuditAction.PROPERTY_DELETED, entityType: 'property' });
      await flush();

      expect(logger.entries.some((e) => e.level === 'error')).toBe(true);
    });

    it('record não devolve promessa — quem chama não espera nem trata', () => {
      expect(
        service.record({ action: AuditAction.LOGIN_SUCCEEDED, entityType: 'user' }),
      ).toBeUndefined();
    });
  });

  describe('sanitização do metadata', () => {
    it.each([
      ['password', { password: 'segredo123' }],
      ['passwordHash', { passwordHash: '$2b$10$abc' }],
      ['senha', { senha: 'segredo' }],
      ['token', { token: 'eyJhbGci' }],
      ['refreshToken', { refreshToken: 'abc' }],
      ['apiKey', { apiKey: 'sk-123' }],
      ['authorization', { authorization: 'Bearer x' }],
      ['messageBody', { messageBody: 'oi, quero uma casa' }],
      ['content', { content: 'texto da conversa' }],
      ['transcribedText', { transcribedText: 'audio do cliente' }],
    ])('remove %s', (_label, metadata) => {
      expect(service.sanitize(metadata)).toEqual({});
    });

    it('a lista é por substring, não por igualdade', () => {
      // Na prática o que aparece é variação: `userPassword`, `evolutionApiKey`.
      const limpo = service.sanitize({
        userPassword: 'x',
        evolutionApiKey: 'y',
        cidade: 'São Sebastião',
      });
      expect(limpo).toEqual({ cidade: 'São Sebastião' });
    });

    it('mantém escalares úteis', () => {
      expect(service.sanitize({ cidade: 'Maresias', quartos: 3, destaque: true })).toEqual({
        cidade: 'Maresias',
        quartos: 3,
        destaque: true,
      });
    });

    it('trunca strings longas', () => {
      const limpo = service.sanitize({ titulo: 'x'.repeat(500) });
      expect(limpo.titulo).toHaveLength(200);
    });

    it('descarta null e undefined', () => {
      expect(service.sanitize({ a: null, b: undefined, c: 1 })).toEqual({ c: 1 });
    });

    it('mantém array de escalares, limitado', () => {
      const limpo = service.sanitize({ campos: ['price', 'city'] });
      expect(limpo.campos).toEqual(['price', 'city']);

      const grande = service.sanitize({ campos: new Array(50).fill('x') });
      expect((grande.campos as string[]).length).toBe(20);
    });

    /**
     * Array de objetos é o caminho mais curto para arrastar conteúdo que a lista
     * de chaves proibidas não previu.
     */
    it('descarta objetos dentro de array', () => {
      const limpo = service.sanitize({ itens: [{ password: 'x' }, 'ok'] });
      expect(limpo.itens).toEqual(['ok']);
    });

    it('sanitiza em profundidade', () => {
      const limpo = service.sanitize({ usuario: { nome: 'Ana', password: 'x' } });
      expect(limpo).toEqual({ usuario: { nome: 'Ana' } });
    });

    /**
     * Limite de profundidade não é zelo: um metadata com a entidade inteira
     * arrastaria relações e, com elas, campos imprevistos.
     */
    it('corta acima da profundidade máxima', () => {
      // O que sobra não é `{ a: { b: {} } }`: objeto que sanitiza para vazio é
      // descartado, e o descarte sobe em cascata. Melhor assim — casca vazia na
      // trilha é ruído que aparenta informação.
      expect(service.sanitize({ a: { b: { c: { d: 'fundo demais' } } } })).toEqual({});
    });

    it('mantém o que está dentro da profundidade, descartando só o excesso', () => {
      const limpo = service.sanitize({
        cidade: 'Maresias',
        nivel1: { quartos: 3, nivel2: { area: 180, nivel3: { sumiu: true } } },
      });
      expect(limpo).toEqual({
        cidade: 'Maresias',
        nivel1: { quartos: 3, nivel2: { area: 180 } },
      });
    });

    it('valor não-objeto vira metadata vazio', () => {
      expect(service.sanitize('texto solto' as any)).toEqual({});
      expect(service.sanitize(null)).toEqual({});
    });

    it('o metadata gravado passa pela sanitização', async () => {
      service.record({
        action: AuditAction.LOGIN_FAILED,
        entityType: 'user',
        metadata: { email: 'a@b.c', password: 'segredo' },
      });
      await flush();

      expect(repo.saved[0].metadata).toEqual({ email: 'a@b.c' });
    });
  });

  describe('consulta', () => {
    it('limita o tamanho da página', async () => {
      await service.query({ limit: 5000 });
      expect(repo.lastQb._state.take).toBe(100);
    });

    it('rejeita página menor que 1', async () => {
      await service.query({ page: 0 });
      expect(repo.lastQb._state.skip).toBe(0);
    });

    it('aplica os filtros informados', async () => {
      await service.query({ actorId: 'u1', entityType: 'property', action: AuditAction.PROPERTY_DELETED });
      const sqls = repo.lastQb._state.wheres.map((w: any) => w.sql).join(' ');
      expect(sqls).toContain('actorId');
      expect(sqls).toContain('entityType');
      expect(sqls).toContain('action');
    });

    it('não aplica filtro que não foi informado', async () => {
      await service.query({});
      expect(repo.lastQb._state.wheres).toHaveLength(0);
    });
  });
});
