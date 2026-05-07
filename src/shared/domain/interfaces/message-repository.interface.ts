import { Message } from '../entities/message.entity';
import { PaginatedResult } from './conversation-repository.interface';

export interface IMessageRepository {
  save(message: Message): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findByConversationId(conversationId: string): Promise<Message[]>;
  findByConversationIdPaginated(
    conversationId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Message>>;
  findByMessageId(messageId: string): Promise<Message | null>;
}
