import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService], // Exportar para permitir uso em outros módulos
})
export class ChatModule {}


