import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  EmbeddingInputType,
  EmbeddingProviderName,
  EmbeddingResult,
  IEmbeddingProvider,
} from './embedding-provider.interface';

const OPENAI_NATIVE_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-ada-002': 1536,
};

@Injectable()
export class OpenAiEmbeddingProviderService implements IEmbeddingProvider {
  private readonly logger = new Logger(OpenAiEmbeddingProviderService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiBaseUrl: string;
  private readonly requestTimeoutMs = 30000;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('OPENAI_API_KEY') || '';
    this.model = config.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small';
    this.apiBaseUrl = config.get<string>('OPENAI_API_BASE_URL') || 'https://api.openai.com/v1';
  }

  getProviderName(): EmbeddingProviderName {
    return 'openai';
  }

  getModel(): string {
    return this.model;
  }

  getDimension(): number {
    return OPENAI_NATIVE_DIMENSIONS[this.model] ?? 1536;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generate(text: string, _opts?: { inputType?: EmbeddingInputType }): Promise<EmbeddingResult> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }
    if (!text || text.trim().length === 0) {
      throw new Error('Texto não pode ser vazio');
    }

    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/embeddings`,
        { model: this.model, input: text },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.requestTimeoutMs,
        },
      );

      const embedding = response.data?.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Resposta da API OpenAI inválida: embedding ausente');
      }
      if (embedding.some((v: unknown) => typeof v !== 'number' || !Number.isFinite(v))) {
        throw new Error('Embedding contém valores não numéricos');
      }

      const expected = this.getDimension();
      if (embedding.length !== expected) {
        throw new Error(
          `Dimensão inesperada do OpenAI: recebido ${embedding.length}, esperado ${expected} (modelo ${this.model})`,
        );
      }

      return {
        vector: embedding,
        provider: 'openai',
        model: this.model,
        dimension: embedding.length,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Erro na requisição à API OpenAI', {
          status: error.response?.status,
          data: error.response?.data,
          model: this.model,
        });
        throw new Error(
          `Falha ao gerar embedding (OpenAI): ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }
}
