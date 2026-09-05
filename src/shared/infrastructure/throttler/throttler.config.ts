/**
 * Configuração do rate limiting (F-NFR segurança).
 *
 * Duas janelas nomeadas, ambas ativas em toda rota:
 *
 * - `short`  — janela de 1 minuto. Pega rajada.
 * - `daily`  — janela de 24 horas. Pega o loop lento, que passa por baixo do
 *              limite por minuto e mesmo assim gera fatura ou raspa o catálogo.
 *
 * Uma janela só não cobre os dois: 5 req/min permitiria 7.200 chamadas por dia.
 *
 * Os valores default nascem **folgados** de propósito. Limite apertado demais
 * gera incidente de falso positivo — usuário legítimo bloqueado — e o custo
 * disso é maior que o de uma janela a mais de abuso. Apertar depois, com base
 * em métrica real, é barato; explicar por que o site recusou um cliente não é.
 */

const int = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Leitura pública do catálogo: precisa caber navegação real com filtros e paginação. */
export const publicReadLimits = () => ({
  short: int('THROTTLE_PUBLIC_PER_MINUTE', 120),
  daily: int('THROTTLE_PUBLIC_PER_DAY', 10_000),
});

/**
 * Endpoints que fazem chamada paga a provedor de IA (`/properties/extract`,
 * `/chat`). Cada requisição custa dinheiro de verdade — o `/chat` é público e a
 * spec estima 0,5 a 2 centavos de dólar por mensagem.
 */
export const aiLimits = () => ({
  short: int('THROTTLE_AI_PER_MINUTE', 10),
  daily: int('THROTTLE_AI_PER_DAY', 200),
});

/** Autenticação: defesa contra força bruta, não contra custo. */
export const authLimits = () => ({
  short: int('THROTTLE_AUTH_PER_MINUTE', 10),
  daily: int('THROTTLE_AUTH_PER_DAY', 100),
});

export const throttlerDefinitions = () => {
  const publicRead = publicReadLimits();
  return [
    { name: 'short', ttl: MINUTE_MS, limit: publicRead.short },
    { name: 'daily', ttl: DAY_MS, limit: publicRead.daily },
  ];
};

/** Açúcar para os decoradores `@Throttle` das rotas, mantendo as duas janelas juntas. */
export const throttle = (limits: { short: number; daily: number }) => ({
  short: { limit: limits.short, ttl: MINUTE_MS },
  daily: { limit: limits.daily, ttl: DAY_MS },
});
