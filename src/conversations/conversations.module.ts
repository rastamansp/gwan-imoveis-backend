import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { WhatsappWebhookModule } from '../whatsapp-webhook/whatsapp-webhook.module';
import { ConversationsController } from './conversations.controller';
import { ListConversationsUseCase } from './use-cases/list-conversations.use-case';
import { GetConversationDetailUseCase } from './use-cases/get-conversation-detail.use-case';
import { ReplyConversationUseCase } from './use-cases/reply-conversation.use-case';
import { AssignConversationUseCase } from './use-cases/assign-conversation.use-case';
import { CloseConversationUseCase } from './use-cases/close-conversation.use-case';

@Module({
  imports: [SharedModule, WhatsappWebhookModule],
  controllers: [ConversationsController],
  providers: [
    ListConversationsUseCase,
    GetConversationDetailUseCase,
    ReplyConversationUseCase,
    AssignConversationUseCase,
    CloseConversationUseCase,
  ],
})
export class ConversationsModule {}
