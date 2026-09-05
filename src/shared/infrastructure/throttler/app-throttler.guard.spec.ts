import { AppThrottlerGuard } from './app-throttler.guard';
import {
  aiLimits,
  authLimits,
  publicReadLimits,
  throttle,
  throttlerDefinitions,
  MINUTE_MS,
  DAY_MS,
} from './throttler.config';

/**
 * Expõe os métodos protegidos do guard para teste. Testar a identificação do
 * cliente é o ponto: é ali que mora a falha que só apareceria em produção.
 */
class GuardProbe extends AppThrottlerGuard {
  public tracker(req: Record<string, any>): Promise<string> {
    return (this as any).getTracker(req);
  }
}

const guard = () => new GuardProbe({} as any, {} as any, {} as any);

describe('AppThrottlerGuard — identificação do cliente', () => {
  it('conta usuário autenticado pelo id, não pelo IP', async () => {
    const tracker = await guard().tracker({ user: { id: 'corretor-1' }, ip: '10.0.0.1' });
    expect(tracker).toBe('user:corretor-1');
  });

  /**
   * Dois corretores no mesmo escritório saem pelo mesmo IP; sem isso um
   * consumiria a cota do outro.
   */
  it('separa usuários distintos que vêm do mesmo IP', async () => {
    const g = guard();
    const a = await g.tracker({ user: { id: 'corretor-1' }, ip: '10.0.0.1' });
    const b = await g.tracker({ user: { id: 'corretor-2' }, ip: '10.0.0.1' });
    expect(a).not.toBe(b);
  });

  it('usa o endereço de origem quando não há sessão', async () => {
    const tracker = await guard().tracker({ ip: '203.0.113.7', headers: {} });
    expect(tracker).toBe('ip:203.0.113.7');
  });

  /**
   * O teste que prova que o `trust proxy` está certo. Sem separar por
   * X-Forwarded-For, todo visitante compartilharia o IP do Traefik e o limite
   * viraria um teto global acidental — falha invisível em dev, onde não há proxy.
   */
  it('separa clientes distintos atrás do proxy', async () => {
    const g = guard();
    const a = await g.tracker({ headers: { 'x-forwarded-for': '198.51.100.1' } });
    const b = await g.tracker({ headers: { 'x-forwarded-for': '198.51.100.2' } });
    expect(a).toBe('ip:198.51.100.1');
    expect(b).toBe('ip:198.51.100.2');
    expect(a).not.toBe(b);
  });

  it('usa o primeiro endereço da cadeia de X-Forwarded-For', async () => {
    const tracker = await guard().tracker({
      headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1, 172.16.0.1' },
    });
    expect(tracker).toBe('ip:198.51.100.1');
  });

  it('aceita X-Forwarded-For repetido como array', async () => {
    const tracker = await guard().tracker({
      headers: { 'x-forwarded-for': ['198.51.100.9, 10.0.0.1', '172.16.0.1'] },
    });
    expect(tracker).toBe('ip:198.51.100.9');
  });

  it('cai no socket quando não há ip nem cabeçalho', async () => {
    const tracker = await guard().tracker({ headers: {}, socket: { remoteAddress: '192.0.2.5' } });
    expect(tracker).toBe('ip:192.0.2.5');
  });

  it('não quebra quando não há origem alguma', async () => {
    expect(await guard().tracker({})).toBe('ip:desconhecido');
  });
});

describe('configuração das faixas', () => {
  const ENV = [
    'THROTTLE_PUBLIC_PER_MINUTE',
    'THROTTLE_PUBLIC_PER_DAY',
    'THROTTLE_AI_PER_MINUTE',
    'THROTTLE_AI_PER_DAY',
    'THROTTLE_AUTH_PER_MINUTE',
    'THROTTLE_AUTH_PER_DAY',
  ];

  beforeEach(() => ENV.forEach((k) => delete process.env[k]));
  afterAll(() => ENV.forEach((k) => delete process.env[k]));

  it('declara as duas janelas nomeadas: minuto e dia', () => {
    const definitions = throttlerDefinitions();
    expect(definitions.map((d) => d.name)).toEqual(['short', 'daily']);
    expect(definitions.find((d) => d.name === 'short')!.ttl).toBe(MINUTE_MS);
    expect(definitions.find((d) => d.name === 'daily')!.ttl).toBe(DAY_MS);
  });

  /**
   * Uma janela só não cobre os dois riscos: 10 req/min permitiria 14.400
   * chamadas pagas por dia. A janela diária é o que pega o loop lento.
   */
  it('a janela diária de IA é menor que o teto por minuto multiplicado pelo dia', () => {
    const ai = aiLimits();
    expect(ai.daily).toBeLessThan(ai.short * 60 * 24);
  });

  it('IA e autenticação são mais estritas que a leitura pública', () => {
    const publico = publicReadLimits();
    expect(aiLimits().short).toBeLessThan(publico.short);
    expect(authLimits().short).toBeLessThan(publico.short);
    expect(aiLimits().daily).toBeLessThan(publico.daily);
  });

  it('permite ajustar os limites por variável de ambiente', () => {
    process.env.THROTTLE_AI_PER_MINUTE = '3';
    process.env.THROTTLE_AI_PER_DAY = '30';
    expect(aiLimits()).toEqual({ short: 3, daily: 30 });
  });

  it.each([
    ['valor não numérico', 'abc'],
    ['zero', '0'],
    ['negativo', '-5'],
    ['vazio', ''],
  ])('ignora %s e mantém o default seguro', (_label, value) => {
    process.env.THROTTLE_AI_PER_MINUTE = value;
    expect(aiLimits().short).toBe(10);
  });

  it('trunca valor fracionário', () => {
    process.env.THROTTLE_AI_PER_MINUTE = '7.9';
    expect(aiLimits().short).toBe(7);
  });

  it('o açúcar @Throttle monta as duas janelas com os TTLs certos', () => {
    expect(throttle({ short: 5, daily: 50 })).toEqual({
      short: { limit: 5, ttl: MINUTE_MS },
      daily: { limit: 50, ttl: DAY_MS },
    });
  });
});
