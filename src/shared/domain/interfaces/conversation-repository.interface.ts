import { Conversation } from '../entities/conversation.entity';
import { ConversationStatus } from '../value-objects/conversation-status.enum';

export interface ConversationFilters {
  status?: ConversationStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface IConversationRepository {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findActiveByPhoneNumber(phoneNumber: string): Promise<Conversation | null>;
  findByPhoneNumber(phoneNumber: string): Promise<Conversation[]>;
  findByUserId(userId: string): Promise<Conversation[]>;
  update(id: string, conversation: Conversation): Promise<Conversation | null>;

  // Inbox: listagem paginada para admin (todas) e corretor (somente atribuídas)
  findAllPaginated(filters: ConversationFilters): Promise<PaginatedResult<Conversation>>;
  findAllByRealtorPaginated(realtorId: string, filters: ConversationFilters): Promise<PaginatedResult<Conversation>>;

  // Ações sobre conversa
  assignRealtor(conversationId: string, realtorId: string): Promise<void>;
  close(conversationId: string): Promise<void>;
}
