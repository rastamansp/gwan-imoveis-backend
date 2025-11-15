import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ResponseFormatterService } from './services/response-formatter.service';
import { WhatsAppFormatterService } from './services/formatters/whatsapp-formatter.service';
import { WebFormatterService } from './services/formatters/web-formatter.service';
import { PaginationService } from './services/formatters/pagination.service';
import { SuggestionsService } from './services/suggestions.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SharedModule)],
  controllers: [ChatController],
  providers: [
    ChatService,
    ResponseFormatterService,
    WhatsAppFormatterService,
    WebFormatterService,
    PaginationService,
    SuggestionsService,
  ],
  exports: [ChatService, WhatsAppFormatterService, ResponseFormatterService], // Exportar para permitir uso em outros módulos
})
export class ChatModule {}


