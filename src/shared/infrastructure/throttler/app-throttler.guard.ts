import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

/**
 * O pacote declara `ThrottlerLimitDetail` mas nao o reexporta pelo index, e
 * importar do caminho interno prenderia o codigo a um detalhe de build do
 * @nestjs/throttler. Só precisamos dos dois campos que vao para o log.
 */
type LimitDetail = { limit: number; ttl: number };

/**
 * Guard de rate limiting do app.
 *
 * Muda duas coisas do comportamento padrão, ambas por motivo concreto:
 *
 * 1. **Quem é o cliente.** Usuário autenticado é contado pelo id, não pelo IP:
 *    dois corretores no mesmo escritório saem pelo mesmo IP e não podem
 *    disputar a mesma cota. Sem sessão, cai no endereço de origem.
 *
 * 2. **O estouro é observável.** O padrão apenas devolve 429; aqui ele também
 *    registra `warn` com rota e origem — sem corpo da requisição, que poderia
 *    conter o texto do corretor ou a mensagem do visitante.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger('RateLimit');

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req?.user?.id;
    if (userId) return `user:${userId}`;
    return `ip:${this.resolveIp(req)}`;
  }

  /**
   * Atrás do Traefik, `req.ip` só é o endereço do cliente porque o Express está
   * com `trust proxy` ligado (ver main.ts). O fallback existe para o caso de
   * alguém mexer nessa configuração: sem ele, todo mundo compartilharia o IP do
   * proxy e o limite viraria um teto global acidental — falha que não aparece em
   * dev, onde não há proxy.
   */
  private resolveIp(req: Record<string, any>): string {
    const forwarded = req?.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return String(forwarded[0]).split(',')[0].trim();
    }
    return req?.ip ?? req?.socket?.remoteAddress ?? 'desconhecido';
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: LimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    /**
     * Com janelas nomeadas, o pacote emite `Retry-After-short` /
     * `Retry-After-daily`. Nenhum cliente HTTP, proxy ou biblioteca respeita
     * esses nomes — quem é respeitado é o `Retry-After` puro do padrão. Sem ele,
     * o 429 vira "tente de novo quando quiser", que é o oposto da intenção.
     */
    const seconds = Math.max(1, Math.ceil((detail?.ttl ?? 0) / 1000));
    res?.header?.('Retry-After', String(seconds));

    this.logger.warn(
      `Limite excedido: ${req?.method} ${req?.originalUrl ?? req?.url} ` +
        `(origem=${await this.getTracker(req)}, janela=${detail?.ttl}ms, limite=${detail?.limit})`,
    );

    return super.throwThrottlingException(context, detail as any);
  }
}
