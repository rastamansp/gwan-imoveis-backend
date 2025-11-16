import { Agent } from '../entities/agent.entity';

export interface IAgentRepository {
  save(agent: Agent): Promise<Agent>;
  findById(id: string): Promise<Agent | null>;
  findBySlug(slug: string): Promise<Agent | null>;
  findAll(): Promise<Agent[]>;
  findActive(): Promise<Agent[]>;
}


