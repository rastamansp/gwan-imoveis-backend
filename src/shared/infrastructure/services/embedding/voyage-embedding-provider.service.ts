import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  EmbeddingInputType,
  EmbeddingProviderName,
  EmbeddingResult,
  IEmbeddingProvider,
} from './embedding-provider.interface';

const VOYAGE_NATIVE_DIMENSIONS: Record<string, number> = {
  'voyage-3-lite': 512,
  'voyage-3': 1024,
  'voyage-3-large': 1024,
  'voyage-code-3': 1024,
};

@Injectable()
export class VoyageEmbeddingProviderService implements IEmbeddingProvider {
  private readonly logger = new Logger(VoyageEmbeddingProviderService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiBaseUrl: string;
  private readonly requestTimeoutMs = 30000;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('VOYAGE_API_KEY') || '';
    this.model = config.get<string>('VOYAGE_EMBEDDING_MODEL') || 'voyage-3-lite';
    this.apiBaseUrl = config.get<string>('VOYAGE_API_BASE_URL') || 'https://api.voyageai.com/v1';
  }

  getProviderName(): EmbeddingProviderName {
    return 'voyage';
  }

  getModel(): string {
    return this.model;
  }

  getDimension(): number {
    return VOYAGE_NATIVE_DIMENSIONS[this.model] ?? 512;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generate(text: string, opts?: { inputType?: EmbeddingInputType }): Promise<EmbeddingResult> {
    if (!this.apiKey) {
      throw new Error('VOYAGE_API_KEY não configurada');
    }
    if (!text || text.trim().length === 0) {
      throw new Error('Texto não pode ser vazio');
    }

    const inputType = opts?.inputType ?? 'document';

    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/embeddings`,
        {
          input: [text],
          model: this.model,
          input_type: inputType,
        },
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
        throw new Error('Resposta da API Voyage inválida: embedding ausente');
      }
      if (embedding.some((v: unknown) => typeof v !== 'number' || !Number.isFinite(v))) {
        throw new Error('Embedding contém valores não numéricos');
      }

      const expected = this.getDimension();
      if (embedding.length !== expected) {
        throw new Error(
          `Dimensão inesperada do Voyage: recebido ${embedding.length}, esperado ${expected} (modelo ${this.model})`,
        );
      }

      return {
        vector: embedding,
        provider: 'voyage',
        model: this.model,
        dimension: embedding.length,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Erro na requisição à API Voyage', {
          status: error.response?.status,
          data: error.response?.data,
          model: this.model,
        });
        throw new Error(
          `Falha ao gerar embedding (Voyage): ${error.response?.data?.error?.message ||
            error.response?.data?.detail ||
            error.message}`,
        );
      }
      throw error;
    }
  }
}
