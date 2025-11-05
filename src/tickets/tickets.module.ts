import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { SharedModule } from '../shared/shared.module';
import { WhatsappWebhookModule } from '../whatsapp-webhook/whatsapp-webhook.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [SharedModule, WhatsappWebhookModule, ChatModule],
  controllers: [TicketsController],
})
export class TicketsModule {}
