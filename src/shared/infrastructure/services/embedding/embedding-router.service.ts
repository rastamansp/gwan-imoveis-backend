import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { IEmbeddingService } from '../../../application/interfaces/embedding-service.interface';
import {
  EmbeddingInputType,
  EmbeddingProviderName,
  EmbeddingResult,
  IEmbeddingProvider,
} from './embedding-provider.interface';
import { OpenAiEmbeddingProviderService } from './openai-embedding-provider.service';
import { VoyageEmbeddingProviderService } from './voyage-embedding-provider.service';

@Injectable()
export class EmbeddingRouterService implements IEmbeddingService, OnModuleInit {
  private readonly logger = new Logger(EmbeddingRouterService.name);
  private readonly active: IEmbeddingProvider;

  /** TTL do cache de consulta, em segundos. */
  private readonly cacheTtlSeconds: number;

  private hits = 0;
  private misses = 0;

  constructor(
    config: ConfigService,
    voyage: VoyageEmbeddingProviderService,
    openai: OpenAiEmbeddingProviderService,
    @Optional() @Inject(CACHE_MANAGER) private readonly cache?: Cache,
  ) {
    const requested = (config.get<string>('EMBEDDING_PROVIDER') || 'voyage').toLowerCase();
    this.active = requested === 'openai' ? openai : voyage;

    const ttl = Number(config.get<string>('EMBEDDING_CACHE_TTL_SECONDS'));
    this.cacheTtlSeconds = Number.isFinite(ttl) && ttl > 0 ? ttl : 3600;
  }

  /**
   * Chave do cache de consulta.
   *
   * **O provider e o modelo fazem parte da chave, e isso não é detalhe.** Voyage
   * devolve 512 dimensões e OpenAI 1536. Servir o vetor do provider errado não
   * gera erro em lugar nenhum: gera resultado de busca silenciosamente incorreto,
   * que é o pior defeito possível numa feature cuja única entrega é relevância.
   *
   * A normalização é **conservadora de propósito** — só `trim`, espaços e caixa.
   * Remover acento ou stopword mudaria o vetor, e o cache passaria a responder
   * uma pergunta diferente da que foi feita.
   */
  private cacheKey(text: string): string {
    const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
    const digest = createHash('sha256').update(normalized).digest('hex');
    return `emb:${this.active.getProviderName()}:${this.active.getModel()}:${digest}`;
  }

  onModuleInit(): void {
    const name = this.active.getProviderName();
    const model = this.active.getModel();
    const dim = this.active.getDimension();
    this.logger.log(`Embedding provider ativo: ${name} (modelo=${model}, dim=${dim})`);

    if (!this.active.isConfigured()) {
      this.logger.error(
        `Provider ${name} ativo mas API key não configurada. Busca semântica retornará 503; create/update seguem sem embedding.`,
      );
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.active.generate(text, { inputType: 'document' });
    return result.vector;
  }

  /**
   * Só a consulta é cacheada. Embedding de imóvel já é persistido no PostgreSQL
   * pelo fluxo de create/update — cacheá-lo seria guardar duas vezes o mesmo dado
   * e encher o Redis com o que já tem dono.
   *
   * Qualquer falha do cache cai direto no provider: o Redis da P0 é cache
   * `allkeys-lru`, então a chave **pode sumir a qualquer momento** e ausência é
   * caso normal, não erro.
   */
  async generateEmbeddingDetailed(text: string, inputType: EmbeddingInputType = 'document'): Promise<EmbeddingResult> {
    if (inputType !== 'query' || !this.cache) {
      return this.active.generate(text, { inputType });
    }

    const key = this.cacheKey(text);

    try {
      const cached = await this.cache.get<EmbeddingResult>(key);
      if (cached?.vector?.length) {
        this.hits++;
        this.logger.debug(`cache de embedding: acerto (${this.hitRate()})`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(
        `cache de embedding indisponível na leitura: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.misses++;
    const result = await this.active.generate(text, { inputType });

    try {
      await this.cache.set(key, result, this.cacheTtlSeconds * 1000);
    } catch (error) {
      this.logger.warn(
        `cache de embedding indisponível na escrita: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return result;
  }

  /**
   * Taxa de acerto para conferir, com número, se os ~30% estimados no SDD se
   * confirmam. O **texto da consulta nunca entra no log** — só a contagem.
   */
  hitRate(): string {
    const total = this.hits + this.misses;
    if (total === 0) return 'sem amostras';
    return `${((this.hits / total) * 100).toFixed(1)}% de ${total}`;
  }

  cacheStats(): { hits: number; misses: number; enabled: boolean; ttlSeconds: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      enabled: Boolean(this.cache),
      ttlSeconds: this.cacheTtlSeconds,
    };
  }

  getEmbeddingDimension(): number {
    return this.active.getDimension();
  }

  getModel(): string {
    return this.active.getModel();
  }

  getProviderName(): EmbeddingProviderName {
    return this.active.getProviderName();
  }

  isActiveProviderConfigured(): boolean {
    return this.active.isConfigured();
  }
}
