import { Module, forwardRef } from '@nestjs/common';
import { ProductsController, CreditsController, OrdersController, ProductValidationController } from './products.controller';
import { SharedModule } from '../shared/shared.module';
import { ProductWhatsAppNotificationService } from './services/product-whatsapp-notification.service';
import { WhatsappWebhookModule } from '../whatsapp-webhook/whatsapp-webhook.module';

@Module({
  imports: [
    SharedModule,
    forwardRef(() => WhatsappWebhookModule),
  ],
  controllers: [ProductsController, CreditsController, OrdersController, ProductValidationController],
  providers: [
    {
      provide: 'ProductWhatsAppNotificationService',
      useClass: ProductWhatsAppNotificationService,
    },
    ProductWhatsAppNotificationService,
  ],
  exports: [
    'ProductWhatsAppNotificationService',
    ProductWhatsAppNotificationService,
  ],
})
export class ProductsModule {}

