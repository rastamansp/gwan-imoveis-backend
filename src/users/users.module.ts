import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserWhatsappController } from './whatsapp.controller';
import { PromoteUserToCorretorUseCase } from '../shared/application/use-cases/promote-user-to-corretor.use-case';
import { CreateUserWhatsappInstanceUseCase } from '../shared/application/use-cases/create-user-whatsapp-instance.use-case';
import { GetUserWhatsappStatusUseCase } from '../shared/application/use-cases/get-user-whatsapp-status.use-case';
import { ConnectUserWhatsappUseCase } from '../shared/application/use-cases/connect-user-whatsapp.use-case';
import { DisconnectUserWhatsappUseCase } from '../shared/application/use-cases/disconnect-user-whatsapp.use-case';
import { SharedModule } from '../shared/shared.module';
import { WhatsappWebhookModule } from '../whatsapp-webhook/whatsapp-webhook.module';

@Module({
  imports: [SharedModule, forwardRef(() => WhatsappWebhookModule)],
  controllers: [UsersController, UserWhatsappController],
  providers: [
    PromoteUserToCorretorUseCase,
    CreateUserWhatsappInstanceUseCase,
    GetUserWhatsappStatusUseCase,
    ConnectUserWhatsappUseCase,
    DisconnectUserWhatsappUseCase,
  ],
  exports: [],
})
export class UsersModule {}
