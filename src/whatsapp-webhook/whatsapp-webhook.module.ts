import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { SharedModule } from '../shared/shared.module';
import { ChatModule } from '../chat/chat.module';
import { EvolutionApiService } from './services/evolution-api.service';
import { RegistrationService } from './services/registration.service';
import { AudioTranscriptionService } from './services/audio-transcription.service';
import { AudioTranscriptionReconciler } from './services/audio-transcription.reconciler';
import { GwanSttTranscriptionService } from '../shared/infrastructure/services/gwan-stt-transcription.service';
import { WhatsappAudioTranscription } from '../shared/domain/entities/whatsapp-audio-transcription.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WhatsappAudioTranscription]),
    forwardRef(() => SharedModule),
    forwardRef(() => ChatModule),
  ],
  controllers: [WhatsappWebhookController],
  providers: [
    WhatsappWebhookService,
    EvolutionApiService,
    RegistrationService,
    AudioTranscriptionService,
    AudioTranscriptionReconciler,
    { provide: 'ITranscriptionService', useClass: GwanSttTranscriptionService },
  ],
  exports: [WhatsappWebhookService, EvolutionApiService, AudioTranscriptionService],
})
export class WhatsappWebhookModule {}

