import { Injectable, Inject } from '@nestjs/common';
import { IConversationRepository } from '../../domain/interfaces/conversation-repository.interface';
import { IAgentRepository } from '../../domain/interfaces/agent-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { Agent } from '../../domain/entities/agent.entity';
import { Conversation } from '../../domain/entities/conversation.entity';
import { ILogger } from '../interfaces/logger.interface';

export interface ResolveConversationAgentInput {
  conversationId: string;
  userId?: string | null;
  fallbackAgentSlug?: string;
}

export interface ResolveConversationAgentResult {
  conversation: Conversation;
  agent: Agent;
}

@Injectable()
export class ResolveConversationAgentUseCase {
  private readonly defaultAgentSlug = 'corretor-imoveis';

  constructor(
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IAgentRepository')
    private readonly agentRepository: IAgentRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Resolve qual agente deve responder uma conversa, seguindo a prioridade:
   * 1) Agente configurado na própria conversa (currentAgentId)
   * 2) Agente preferido do usuário
   * 3) Fallback explícito (fallbackAgentSlug)
   * 4) Agente padrão (corretor-imoveis)
   */
  public async execute(input: ResolveConversationAgentInput): Promise<ResolveConversationAgentResult> {
    const { conversationId, userId, fallbackAgentSlug } = input;

    this.logger.info('[Agent] Resolvendo agente da conversa', {
      conversationId,
      userId: userId || null,
      fallbackAgentSlug: fallbackAgentSlug || null,
    });

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversa não encontrada: ${conversationId}`);
    }

    // 1) Se foi passado fallback explícito (ex: troca de agente via comando),
    // ele tem prioridade máxima e deve sobrescrever o agente atual da conversa.
    if (fallbackAgentSlug) {
      const fallbackAgent = await this.agentRepository.findBySlug(fallbackAgentSlug);
      if (!fallbackAgent || !fallbackAgent.active) {
        throw new Error(`Agente de fallback inválido ou inativo: ${fallbackAgentSlug}`);
      }

      await this.updateConversationAgent(conversation, fallbackAgent);
      return { conversation, agent: fallbackAgent };
    }

    // 2) Se a conversa já tem agente corrente, tentar usar
    if (conversation.currentAgentId) {
      const conversationAgent = await this.agentRepository.findById(conversation.currentAgentId);
      if (conversationAgent && conversationAgent.active) {
        return { conversation, agent: conversationAgent };
      }
    }

    // 3) Tentar agente preferido do usuário
    if (userId || conversation.userId) {
      const effectiveUserId = userId || conversation.userId;
      if (effectiveUserId) {
        const user = await this.userRepository.findById(effectiveUserId);
        if (user?.preferredAgentId) {
          const userAgent = await this.agentRepository.findById(user.preferredAgentId);
          if (userAgent && userAgent.active) {
            await this.updateConversationAgent(conversation, userAgent);
            return { conversation, agent: userAgent };
          }
        }
      }
    }

    // 4) Agente padrão (corretor-imoveis)
    const defaultAgent = await this.ensureDefaultAgents();

    await this.updateConversationAgent(conversation, defaultAgent);
    return { conversation, agent: defaultAgent };
  }

  private async updateConversationAgent(conversation: Conversation, agent: Agent): Promise<void> {
    if (conversation.currentAgentId === agent.id) {
      return;
    }

    conversation.currentAgentId = agent.id;
    await this.conversationRepository.save(conversation);

    this.logger.info('[Agent] Agente da conversa atualizado', {
      conversationId: conversation.id,
      agentId: agent.id,
      agentSlug: agent.slug,
    });
  }

  /**
   * Garante que os agentes padrão (events/health) existam.
   * Útil em ambientes de desenvolvimento onde migrations/seeds podem não ter rodado.
   */
  private async ensureDefaultAgents(): Promise<Agent> {
    let eventsAgent = await this.agentRepository.findBySlug(this.defaultAgentSlug);

    if (!eventsAgent) {
      this.logger.warn('[Agent] Agente padrão não encontrado, criando agente padrão (corretor-imoveis)', {});

      // Criar agente de imóveis
      const imoveis = Agent.create('Corretor de Imóveis', 'corretor-imoveis', '/api/chat', true);
      try {
        eventsAgent = await this.agentRepository.save(imoveis);
      } catch (error) {
        // Em caso de condição de corrida (unique constraint), tentar ler novamente
        this.logger.warn('[Agent] Erro ao salvar agente corretor-imoveis, tentando reler do repositório', {
          error: error instanceof Error ? error.message : String(error),
        });
        eventsAgent = await this.agentRepository.findBySlug(this.defaultAgentSlug);
      }
    }

    if (!eventsAgent || !eventsAgent.active) {
      throw new Error('Agente padrão (corretor-imoveis) não encontrado ou inativo');
    }

    return eventsAgent;
  }
}


