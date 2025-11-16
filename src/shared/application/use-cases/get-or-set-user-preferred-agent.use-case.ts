import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { IAgentRepository } from '../../domain/interfaces/agent-repository.interface';
import { Agent } from '../../domain/entities/agent.entity';
import { ILogger } from '../interfaces/logger.interface';

export interface GetOrSetUserPreferredAgentInput {
  userId: string;
  preferredAgentSlug?: string;
}

export interface GetOrSetUserPreferredAgentResult {
  userId: string;
  agent: Agent;
}

@Injectable()
export class GetOrSetUserPreferredAgentUseCase {
  // Default global para Corretor de Imóveis
  private readonly defaultAgentSlug = 'corretor-imoveis';

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IAgentRepository')
    private readonly agentRepository: IAgentRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Retorna o agente preferido do usuário, definindo o padrão (events)
   * se ainda não houver agente configurado ou se for solicitado update.
   */
  public async execute(input: GetOrSetUserPreferredAgentInput): Promise<GetOrSetUserPreferredAgentResult> {
    const { userId, preferredAgentSlug } = input;

    this.logger.info('[Agent] Obtendo/atualizando agente preferido do usuário', {
      userId,
      preferredAgentSlug: preferredAgentSlug || null,
    });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuário não encontrado para definir agente preferido: ${userId}`);
    }

    // Se foi solicitado explicitamente um slug, tentar atualizar
    if (preferredAgentSlug) {
      const targetAgent = await this.agentRepository.findBySlug(preferredAgentSlug);
      if (!targetAgent || !targetAgent.active) {
        throw new Error(`Agente inválido ou inativo: ${preferredAgentSlug}`);
      }

      user.preferredAgentId = targetAgent.id;
      await this.userRepository.save(user);

      this.logger.info('[Agent] Agente preferido atualizado para usuário', {
        userId,
        agentId: targetAgent.id,
        agentSlug: targetAgent.slug,
      });

      return { userId, agent: targetAgent };
    }

    // Caso não haja agente preferido, usar default global (corretor-imoveis)
    let agent: Agent | null = null;
    if (user.preferredAgentId) {
      const existingAgent = await this.agentRepository.findById(user.preferredAgentId);
      if (existingAgent && existingAgent.active) {
        agent = existingAgent;
      }
    }

    if (!agent) {
      // Buscar agente padrão por slug
      const defaultAgent = await this.agentRepository.findBySlug(this.defaultAgentSlug);
      if (!defaultAgent || !defaultAgent.active) {
        throw new Error('Agente padrão (corretor-imoveis) não encontrado ou inativo');
      }

      user.preferredAgentId = defaultAgent.id;
      await this.userRepository.save(user);

      this.logger.info('[Agent] Definido agente padrão para usuário', {
        userId,
        agentId: defaultAgent.id,
        agentSlug: defaultAgent.slug,
      });

      agent = defaultAgent;
    }

    return { userId, agent };
  }
}


