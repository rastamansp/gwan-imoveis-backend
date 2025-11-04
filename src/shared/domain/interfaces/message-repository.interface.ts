import { Message } from '../entities/message.entity';

export interface IMessageRepository {
  save(message: Message): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findByConversationId(conversationId: string): Promise<Message[]>;
  findByMessageId(messageId: string): Promise<Message | null>;
}

