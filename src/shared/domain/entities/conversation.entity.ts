import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ConversationStatus } from '../value-objects/conversation-status.enum';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations')
@Index(['phoneNumber'])
@Index(['userId'])
@Index(['status'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  phoneNumber: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'varchar', length: 100 })
  instanceName: string;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.ACTIVE })
  status: ConversationStatus;

  @Column({ type: 'uuid', nullable: true })
  currentAgentId: string | null;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  // Constructor vazio para TypeORM
  constructor() {}

  // Constructor com parâmetros para criação manual
  static create(
    id: string,
    phoneNumber: string,
    instanceName: string,
    userId?: string | null,
    status: ConversationStatus = ConversationStatus.ACTIVE,
    startedAt: Date = new Date(),
    endedAt: Date | null = null,
  ): Conversation {
    const conversation = new Conversation();
    conversation.id = id;
    conversation.phoneNumber = phoneNumber;
    conversation.instanceName = instanceName;
    conversation.userId = userId || null;
    conversation.status = status;
    conversation.startedAt = startedAt;
    conversation.endedAt = endedAt;
    return conversation;
  }

  // Métodos de domínio
  public isActive(): boolean {
    return this.status === ConversationStatus.ACTIVE && !this.endedAt;
  }

  public end(): void {
    this.status = ConversationStatus.ENDED;
    this.endedAt = new Date();
  }

  public associateUser(userId: string): void {
    this.userId = userId;
  }
}

