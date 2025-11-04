import { Conversation } from '../entities/conversation.entity';

export interface IConversationRepository {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findActiveByPhoneNumber(phoneNumber: string): Promise<Conversation | null>;
  findByPhoneNumber(phoneNumber: string): Promise<Conversation[]>;
  findByUserId(userId: string): Promise<Conversation[]>;
  update(id: string, conversation: Conversation): Promise<Conversation | null>;
}

