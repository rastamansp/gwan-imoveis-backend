import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { MessageDirection } from '../value-objects/message-direction.enum';
import { MessageChannel } from '../value-objects/message-channel.enum';
import { Conversation } from './conversation.entity';

@Entity('messages')
  @Index(['conversationId'])
  @Index(['messageId'])
  @Index(['direction'])
  @Index(['timestamp'])
  @Index(['phoneNumber'])
  @Index(['channel'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phoneNumber: string | null; // Número de telefone do usuário

  @Column({ type: 'varchar', length: 255, nullable: true })
  messageId: string | null; // ID da mensagem do WhatsApp (pode ser null para mensagens do chat)

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: MessageDirection })
  direction: MessageDirection;

  @Column({ type: 'uuid', nullable: true })
  agentId: string | null;

  @Column({ type: 'enum', enum: MessageChannel, nullable: true })
  channel: MessageChannel | null; // Canal de comunicação (WEB, WHATSAPP)

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  response: string | null; // Resposta do chat (apenas para mensagens incoming que geraram resposta)

  @Column({ type: 'jsonb', nullable: true })
  toolsUsed: any[] | null; // Tools usadas pelo chat (apenas para mensagens incoming que geraram resposta)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Constructor vazio para TypeORM
  constructor() {}

  // Constructor com parâmetros para criação manual
  static create(
    id: string,
    conversationId: string,
    content: string,
    direction: MessageDirection,
    timestamp: Date = new Date(),
    messageId?: string | null,
    phoneNumber?: string | null,
    channel?: MessageChannel | null,
    response?: string | null,
    toolsUsed?: any[] | null,
    agentId?: string | null,
  ): Message {
    const message = new Message();
    message.id = id;
    message.conversationId = conversationId;
    message.content = content;
    message.direction = direction;
    message.timestamp = timestamp;
    message.messageId = messageId || null;
    message.phoneNumber = phoneNumber || null;
    message.channel = channel || null;
    message.response = response || null;
    message.toolsUsed = toolsUsed || null;
    message.agentId = agentId || null;
    return message;
  }

  // Métodos de domínio
  public isIncoming(): boolean {
    return this.direction === MessageDirection.INCOMING;
  }

  public isOutgoing(): boolean {
    return this.direction === MessageDirection.OUTGOING;
  }

  public setResponse(response: string, toolsUsed?: any[]): void {
    this.response = response;
    this.toolsUsed = toolsUsed || null;
  }
}

