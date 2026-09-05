import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditLog } from '../../domain/entities/audit-log.entity';
import { ILogger } from '../interfaces/logger.interface';

export interface AuditRecordInput {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditQuery {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

/**
 * Chaves que nunca entram na trilha, em nenhum nível do metadata.
 *
 * A lista é por **substring** e não por igualdade: o que aparece na prática é
 * `passwordHash`, `refreshToken`, `apikey`, `messageBody` — variações do mesmo
 * tema. Casar exato deixaria todas passarem.
 */
const CHAVES_PROIBIDAS = [
  'password',
  'senha',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'body',
  'content',
  'mensagem',
  'message',
  'text',
  'transcri',
];

const MAX_STRING = 200;
const MAX_PROFUNDIDADE = 3;

/**
 * Trilha de auditoria (F19).
 *
 * Duas decisões governam este serviço:
 *
 * 1. **Best-effort.** Falha ao auditar registra erro e **nunca** propaga. A
 *    alternativa — transação conjunta com a operação de negócio — transformaria
 *    um defeito na auditoria em indisponibilidade do produto. Auditoria é
 *    evidência, não invariante de negócio: perder um registro num crash é troca
 *    aceitável; apagar imóvel deixar de funcionar porque a trilha caiu, não.
 *
 * 2. **Guarda que a ação aconteceu, não o que ela continha.** Senha, token,
 *    corpo de mensagem de WhatsApp e texto livre do corretor ficam de fora — a
 *    mesma regra que já vale para o log da aplicação.
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Registra a ação. **Não devolve promessa de sucesso**: quem chama segue a
   * vida sem esperar, e sem tratar exceção — não há exceção para tratar.
   */
  record(input: AuditRecordInput): void {
    void this.persist(input);
  }

  private async persist(input: AuditRecordInput): Promise<void> {
    try {
      const entry = this.repository.create({
        action: input.action,
        entityType: input.entityType.slice(0, 64),
        entityId: input.entityId ? String(input.entityId).slice(0, 128) : null,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ? String(input.actorRole).slice(0, 32) : null,
        ip: input.ip ? String(input.ip).slice(0, 64) : null,
        metadata: this.sanitize(input.metadata ?? {}),
      });
      await this.repository.save(entry);
    } catch (error) {
      // Único lugar do serviço onde um erro pode parar: aqui.
      this.logger.error('[Auditoria] Falha ao registrar ação', {
        action: input.action,
        entityType: input.entityType,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Remove chave sensível em qualquer nível e limita tamanho e profundidade.
   *
   * O limite de profundidade não é zelo: um `metadata` com o objeto inteiro de
   * uma entidade arrastaria relações e, com elas, campos que a lista de chaves
   * proibidas não previu.
   */
  sanitize(value: unknown, profundidade = 0): Record<string, unknown> {
    if (profundidade >= MAX_PROFUNDIDADE || value === null || typeof value !== 'object') {
      return {};
    }

    const saida: Record<string, unknown> = {};

    for (const [chave, valor] of Object.entries(value as Record<string, unknown>)) {
      if (this.chaveProibida(chave)) continue;

      if (valor === null || valor === undefined) continue;

      if (typeof valor === 'string') {
        saida[chave] = valor.slice(0, MAX_STRING);
      } else if (typeof valor === 'number' || typeof valor === 'boolean') {
        saida[chave] = valor;
      } else if (Array.isArray(valor)) {
        // Só escalares: array de objetos é o caminho mais curto para arrastar
        // conteúdo que não deveria estar aqui.
        saida[chave] = valor
          .filter((v) => ['string', 'number', 'boolean'].includes(typeof v))
          .slice(0, 20)
          .map((v) => (typeof v === 'string' ? v.slice(0, MAX_STRING) : v));
      } else if (typeof valor === 'object') {
        const aninhado = this.sanitize(valor, profundidade + 1);
        if (Object.keys(aninhado).length > 0) saida[chave] = aninhado;
      }
    }

    return saida;
  }

  private chaveProibida(chave: string): boolean {
    const normalizada = chave.toLowerCase();
    return CHAVES_PROIBIDAS.some((proibida) => normalizada.includes(proibida));
  }

  /** Consulta paginada. Restrita a ADMIN pelo guard do controller. */
  async query(filtros: AuditQuery): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, filtros.page ?? 1);
    const limit = Math.min(100, Math.max(1, filtros.limit ?? 50));

    const qb = this.repository.createQueryBuilder('a');

    if (filtros.actorId) qb.andWhere('a."actorId" = :actorId', { actorId: filtros.actorId });
    if (filtros.entityType) {
      qb.andWhere('a."entityType" = :entityType', { entityType: filtros.entityType });
    }
    if (filtros.entityId) qb.andWhere('a."entityId" = :entityId', { entityId: filtros.entityId });
    if (filtros.action) qb.andWhere('a.action = :action', { action: filtros.action });
    if (filtros.from) qb.andWhere('a."createdAt" >= :from', { from: filtros.from });
    if (filtros.to) qb.andWhere('a."createdAt" <= :to', { to: filtros.to });

    const [data, total] = await qb
      .orderBy('a."createdAt"', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }
}
