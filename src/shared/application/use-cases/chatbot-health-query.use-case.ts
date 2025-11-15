import { Injectable, Inject } from '@nestjs/common';
import { KnowledgeDisease } from '../../domain/entities/knowledge-disease.entity';
import { IKnowledgeDiseaseRepository } from '../../domain/interfaces/knowledge-disease-repository.interface';
import { IEmbeddingService } from '../interfaces/embedding-service.interface';
import { ILogger } from '../interfaces/logger.interface';

export interface ChatbotHealthQueryResult {
  disease: KnowledgeDisease | null;
  similarity?: number;
  searchMethod: 'exact' | 'partial' | 'semantic' | 'hybrid' | 'none';
  alternatives: Array<{
    name: string;
    description: string;
    similarity: number;
  }>;
  answer: string;
}

@Injectable()
export class ChatbotHealthQueryUseCase {
  constructor(
    @Inject('IKnowledgeDiseaseRepository')
    private readonly knowledgeDiseaseRepository: IKnowledgeDiseaseRepository,
    @Inject('IEmbeddingService')
    private readonly embeddingService: IEmbeddingService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(query: string, limit: number = 5): Promise<ChatbotHealthQueryResult> {
    const startTime = Date.now();

    const normalizedQuery = query.trim();

    this.logger.info('Iniciando consulta de chatbot health', {
      query: normalizedQuery,
      limit,
      timestamp: new Date().toISOString(),
    });

    try {
      // 0. Detectar saudações simples para evitar chamada desnecessária ao RAG
      if (this.isGreeting(normalizedQuery)) {
        const duration = Date.now() - startTime;
        this.logger.info('Consulta identificada como saudação, retornando mensagem guiada', {
          query: normalizedQuery,
          duration,
        });

        return {
          disease: null,
          searchMethod: 'none',
          alternatives: [],
          answer:
            'Olá! Sou o assistente de saúde. Para te ajudar melhor, descreva seus sintomas ou a doença que deseja saber mais. Por exemplo: "estou com dor de cabeça e febre há 2 dias" ou "quais plantas são indicadas para gripe?".',
        };
      }

      // 1. Tentar busca exata por nome primeiro
      const exactResults = await this.knowledgeDiseaseRepository.searchByDiseaseName(normalizedQuery);
      
      if (exactResults.length > 0) {
        // Encontrar correspondência exata (case-insensitive)
        const exactMatch = exactResults.find(
          d => d.diseaseName.toLowerCase() === query.toLowerCase()
        );
        
        if (exactMatch) {
          const answer = this.formatDiseaseResponse(exactMatch);
          const alternatives = exactResults
            .filter(d => d.id !== exactMatch.id)
            .slice(0, limit - 1)
            .map(d => ({
              name: d.diseaseName,
              description: d.description.substring(0, 200),
              similarity: 1.0,
            }));

          const duration = Date.now() - startTime;
          this.logger.info('Consulta concluída - busca exata', {
            query: normalizedQuery,
            found: true,
            duration,
          });

          return {
            disease: exactMatch,
            similarity: 1.0,
            searchMethod: 'exact',
            alternatives,
            answer,
          };
        }

        // Se não houver correspondência exata, mas houver resultados parciais
        if (exactResults.length > 0) {
          const bestMatch = exactResults[0];
          const answer = this.formatDiseaseResponse(bestMatch);
          const alternatives = exactResults
            .slice(1, limit)
            .map(d => ({
              name: d.diseaseName,
              description: d.description.substring(0, 200),
              similarity: 0.8,
            }));

          const duration = Date.now() - startTime;
          this.logger.info('Consulta concluída - busca parcial', {
            query: normalizedQuery,
            found: true,
            duration,
          });

          return {
            disease: bestMatch,
            similarity: 0.8,
            searchMethod: 'partial',
            alternatives,
            answer,
          };
        }
      }

      // 2. Se não encontrou por nome, fazer busca semântica
      this.logger.info('Nenhum resultado por nome, tentando busca semântica', {
        query: normalizedQuery,
      });
      
      const queryEmbedding = await this.embeddingService.generateEmbedding(normalizedQuery);
      const semanticResults = await this.knowledgeDiseaseRepository.searchByEmbedding(
        queryEmbedding,
        limit
      );

      if (semanticResults.length === 0) {
        const duration = Date.now() - startTime;
        this.logger.info('Nenhuma doença encontrada', {
          query: normalizedQuery,
          duration,
        });

        return {
          disease: null,
          searchMethod: 'semantic',
          alternatives: [],
          answer: 'Não encontrei informações sobre essa doença na base de conhecimento. Por favor, tente reformular sua pergunta ou verificar a grafia.',
        };
      }

      // Calcular similaridade para o melhor resultado
      const bestMatch = semanticResults[0];
      const bestEmbedding = bestMatch.getEmbeddingArray();
      const similarity = bestEmbedding
        ? this.cosineSimilarity(queryEmbedding, bestEmbedding)
        : 0;

      // Se a similaridade for muito baixa (< 0.4), considerar como não encontrado
      // Isso evita retornar doenças não relacionadas
      // Threshold aumentado para 0.4 para ser mais restritivo
      const MIN_SIMILARITY_THRESHOLD = 0.4;
      if (similarity < MIN_SIMILARITY_THRESHOLD) {
        const duration = Date.now() - startTime;
        this.logger.info('Nenhuma doença encontrada - similaridade muito baixa', {
          query: normalizedQuery,
          similarity,
          duration,
        });

        return {
          disease: null,
          searchMethod: 'semantic',
          alternatives: [],
          answer: 'Não encontrei informações sobre essa doença na base de conhecimento. Por favor, tente reformular sua pergunta ou verificar a grafia.',
        };
      }

      const answer = this.formatDiseaseResponse(bestMatch);
      const alternatives = semanticResults
        .slice(1, limit)
        .map(d => {
          const altEmbedding = d.getEmbeddingArray();
          const altSimilarity = altEmbedding
            ? this.cosineSimilarity(queryEmbedding, altEmbedding)
            : 0;
          return {
            name: d.diseaseName,
            description: d.description.substring(0, 200),
            similarity: altSimilarity,
          };
        });

      const duration = Date.now() - startTime;
      this.logger.info('Consulta concluída - busca semântica', {
        query: normalizedQuery,
        found: true,
        similarity,
        duration,
      });

      return {
        disease: bestMatch,
        similarity,
        searchMethod: 'semantic',
        alternatives,
        answer,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao realizar consulta de chatbot health', {
        query: normalizedQuery,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }

  /**
   * Detecta se a mensagem é apenas uma saudação (ex: "oi", "olá", "bom dia")
   * para evitar consultas desnecessárias à base de conhecimento.
   */
  private isGreeting(query: string): boolean {
    const trimmed = query.trim();
    if (!trimmed) {
      return true;
    }

    // Normalizar acentos e pontuação básica
    const normalized = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[!?.]/g, '')
      .trim();

    const greetings = [
      'oi',
      'ola',
      'olá',
      'opa',
      'e ai',
      'e aí',
      'bom dia',
      'boa tarde',
      'boa noite',
      'ola bom dia',
      'olá bom dia',
    ];

    if (greetings.includes(normalized)) {
      return true;
    }

    // Tratar casos curtos como "bom dia, tudo bem?"
    const MAX_GREETING_LENGTH = 30;
    if (normalized.length <= MAX_GREETING_LENGTH) {
      return greetings.some((greeting) => normalized.startsWith(greeting + ' '));
    }

    return false;
  }

  /**
   * Formata a resposta estruturada com informações da doença
   */
  private formatDiseaseResponse(disease: KnowledgeDisease): string {
    const parts: string[] = [];
    
    parts.push(`Doença: ${disease.diseaseName}`);
    parts.push('');
    parts.push('Descrição:');
    parts.push(disease.description);
    
    if (disease.causes) {
      parts.push('');
      parts.push('Causas:');
      parts.push(disease.causes);
    }
    
    if (disease.treatment) {
      parts.push('');
      parts.push('Tratamento:');
      parts.push(disease.treatment);
    }
    
    if (disease.plants) {
      parts.push('');
      parts.push('Plantas Indicadas:');
      parts.push(disease.plants);
    }
    
    return parts.join('\n');
  }

  /**
   * Calcula a similaridade de cosseno entre dois vetores
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }
}

