/**
 * Traduz a falha do step de disponibilidade para uma mensagem que aponte a causa
 * certa.
 *
 * Antes, `429` e servidor fora do ar produziam o mesmo texto — "API não está
 * disponível" — e a suíte inteira acusava indisponibilidade enquanto a aplicação
 * respondia normalmente. Em 2026-09-05 isso custou um diagnóstico longo: o
 * servidor estava saudável e o que faltava era folga no rate limit.
 */
export function describeApiFailure(error: unknown, baseUrl: string, alvo: string): string {
  const mensagem = error instanceof Error ? error.message : String(error);

  if (/429|too many requests|throttler/i.test(mensagem)) {
    return (
      `${alvo} recusou a requisição em ${baseUrl} por RATE LIMIT (429) — a aplicação está no ar. ` +
      'A suíte dispara mais requisições por minuto do que os limites de produção permitem. ' +
      'Suba a API com os THROTTLE_* de teste indicados no .env.example.'
    );
  }

  return (
    `${alvo} não está disponível em ${baseUrl}. Certifique-se de que a aplicação está rodando. ` +
    `Causa: ${mensagem}`
  );
}
