import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Message } from '../../../shared/domain/entities/message.entity';
import { MessageDirection } from '../../../shared/domain/value-objects/message-direction.enum';
import { MessageChannel } from '../../../shared/domain/value-objects/message-channel.enum';

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  conversationId: string;

  @ApiPropertyOptional()
  phoneNumber: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: MessageDirection })
  direction: MessageDirection;

  @ApiPropertyOptional({ enum: MessageChannel })
  channel: MessageChannel | null;

  @ApiProperty()
  timestamp: Date;

  @ApiPropertyOptional()
  response: string | null;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(message: Message): MessageResponseDto {
    const dto = new MessageResponseDto();
    dto.id = message.id;
    dto.conversationId = message.conversationId;
    dto.phoneNumber = message.phoneNumber;
    dto.content = message.content;
    dto.direction = message.direction;
    dto.channel = message.channel;
    dto.timestamp = message.timestamp;
    dto.response = message.response;
    dto.createdAt = message.createdAt;
    return dto;
  }
}
