import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IEmbeddingService } from '../../application/interfaces/embedding-service.interface';

@Injectable()
export class EmbeddingService implements IEmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openaiApiKey: string;
  private readonly embeddingModel: string;
  private embeddingDimension: number | null = null; // Será detectado automaticamente
  private readonly apiBaseUrl = 'https://api.openai.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.embeddingModel = this.configService.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small';
    
    // Se configurado explicitamente, usar; senão detectar na primeira chamada
    const configuredDimension = this.configService.get<number>('EMBEDDING_DIMENSION');
    if (configuredDimension) {
      this.embeddingDimension = configuredDimension;
      this.logger.log(`Dimensão de embedding configurada: ${this.embeddingDimension}`);
    } else {
      this.logger.log('Dimensão de embedding será detectada automaticamente na primeira chamada');
    }

    if (!this.openaiApiKey) {
      this.logger.warn('OPENAI_API_KEY não configurada. Embeddings não funcionarão.');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Texto não pode ser vazio');
    }

    try {
      this.logger.debug(`Gerando embedding para texto (${text.length} caracteres)`);

      const response = await axios.post(
        `${this.apiBaseUrl}/embeddings`,
        {
          model: this.embeddingModel,
          input: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      // Verificar estrutura da resposta
      if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        this.logger.error('Resposta da API inválida', {
          responseStructure: Object.keys(response.data || {}),
          dataLength: response.data?.data?.length,
        });
        throw new Error('Estrutura de resposta da API inválida');
      }

      const embedding = response.data.data[0].embedding;

      if (!Array.isArray(embedding)) {
        this.logger.error('Embedding não é um array', {
          type: typeof embedding,
          embeddingValue: embedding,
        });
        throw new Error('Embedding não é um array válido');
      }

      if (embedding.length === 0) {
        throw new Error('Embedding vazio');
      }

      // Verificar se todos os elementos são números
      const hasInvalidValues = embedding.some((value: any) => typeof value !== 'number' || !Number.isFinite(value));
      if (hasInvalidValues) {
        this.logger.error('Embedding contém valores inválidos', {
          length: embedding.length,
          sample: embedding.slice(0, 5),
        });
        throw new Error('Embedding contém valores não numéricos');
      }

      // Detectar e atualizar dimensão automaticamente baseada na resposta da API
      if (this.embeddingDimension === null) {
        // Primeira chamada: detectar dimensão
        this.embeddingDimension = embedding.length;
        this.logger.log(`Dimensão de embedding detectada automaticamente: ${this.embeddingDimension} (modelo: ${this.embeddingModel})`);
      } else if (this.embeddingDimension !== embedding.length) {
        // Dimensão diferente: atualizar e logar
        this.logger.warn(`Dimensão do embedding mudou: ${this.embeddingDimension} → ${embedding.length}. Atualizando referência.`);
        this.embeddingDimension = embedding.length;
      }

      this.logger.debug(`Embedding gerado com sucesso (${embedding.length} dimensões, modelo: ${this.embeddingModel})`);
      return embedding;
    } catch (error) {
      // Capturar erros do axios e mostrar detalhes
      if (axios.isAxiosError(error)) {
        this.logger.error('Erro na requisição à API OpenAI', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          model: this.embeddingModel,
          message: error.message,
        });
        
        // Se houver resposta da API, mostrar estrutura
        if (error.response?.data) {
          this.logger.error('Estrutura da resposta de erro', {
            keys: Object.keys(error.response.data),
            data: JSON.stringify(error.response.data).substring(0, 500),
          });
        }
        
        throw new Error(`Falha ao gerar embedding: ${error.response?.data?.error?.message || error.message}`);
      }
      
      this.logger.error('Erro ao gerar embedding', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        model: this.embeddingModel,
      });
      throw new Error(`Falha ao gerar embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getEmbeddingDimension(): number {
    // Se ainda não foi detectado, retornar valor padrão baseado no modelo
    if (this.embeddingDimension === null) {
      const modelDimensions: Record<string, number> = {
        'text-embedding-3-small': 1536,
        'text-embedding-3-large': 3072,
        'text-embedding-ada-002': 1536,
      };
      return modelDimensions[this.embeddingModel] || 1536;
    }
    return this.embeddingDimension;
  }

  getModel(): string {
    return this.embeddingModel;
  }
}

