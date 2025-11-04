import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { SharedModule } from '../shared/shared.module';
import { ChatModule } from '../chat/chat.module';
import { EvolutionApiService } from './services/evolution-api.service';
import { RegistrationService } from './services/registration.service';

@Module({
  imports: [ConfigModule, SharedModule, ChatModule],
  controllers: [WhatsappWebhookController],
  providers: [WhatsappWebhookService, EvolutionApiService, RegistrationService],
  exports: [WhatsappWebhookService],
})
export class WhatsappWebhookModule {}

