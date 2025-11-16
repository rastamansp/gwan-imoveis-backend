import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../../domain/entities/agent.entity';
import { IAgentRepository } from '../../domain/interfaces/agent-repository.interface';

@Injectable()
export class AgentTypeOrmRepository implements IAgentRepository {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async save(agent: Agent): Promise<Agent> {
    return await this.agentRepository.save(agent);
  }

  async findById(id: string): Promise<Agent | null> {
    return await this.agentRepository.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Agent | null> {
    return await this.agentRepository.findOne({ where: { slug } });
  }

  async findAll(): Promise<Agent[]> {
    return await this.agentRepository.find();
  }

  async findActive(): Promise<Agent[]> {
    return await this.agentRepository.find({ where: { active: true } });
  }
}


