import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Conversation } from '../../../shared/domain/entities/conversation.entity';
import { ConversationStatus } from '../../../shared/domain/value-objects/conversation-status.enum';
import { MessageResponseDto } from './message-response.dto';

export class ConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiPropertyOptional()
  userId: string | null;

  @ApiPropertyOptional({ description: 'Nome do usuário associado à conversa' })
  userName: string | null;

  @ApiProperty()
  instanceName: string;

  @ApiProperty({ enum: ConversationStatus })
  status: ConversationStatus;

  @ApiPropertyOptional({ description: 'UUID do corretor atribuído' })
  assignedRealtorId: string | null;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  endedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [MessageResponseDto], description: 'Mensagens — presentes apenas no GET /:id' })
  messages?: MessageResponseDto[];

  static fromEntity(conversation: Conversation, includeMessages = false): ConversationResponseDto {
    const dto = new ConversationResponseDto();
    dto.id = conversation.id;
    dto.phoneNumber = conversation.phoneNumber;
    dto.userId = conversation.userId;
    dto.userName = conversation.user?.name ?? null;
    dto.instanceName = conversation.instanceName;
    dto.status = conversation.status;
    dto.assignedRealtorId = conversation.assignedRealtorId ?? null;
    dto.startedAt = conversation.startedAt;
    dto.endedAt = conversation.endedAt;
    dto.createdAt = conversation.createdAt;
    dto.updatedAt = conversation.updatedAt;

    if (includeMessages && conversation.messages) {
      dto.messages = conversation.messages.map(MessageResponseDto.fromEntity);
    }

    return dto;
  }
}

export class PaginatedConversationsResponseDto {
  @ApiProperty({ type: [ConversationResponseDto] })
  data: ConversationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
