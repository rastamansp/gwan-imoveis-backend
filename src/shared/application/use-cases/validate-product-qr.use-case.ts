import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { IOrderItemRepository } from '../../domain/interfaces/order-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { IProductRepository } from '../../domain/interfaces/product-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { InvalidOperationException } from '../../domain/exceptions/invalid-operation.exception';
import { OrderItemStatus } from '../../domain/value-objects/order-item-status.enum';
import { OrderStatus } from '../../domain/value-objects/order-status.enum';

@Injectable()
export class ValidateProductQRUseCase {
  constructor(
    @Inject('IOrderItemRepository')
    private readonly orderItemRepository: IOrderItemRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    @Optional()
    @Inject(forwardRef(() => {
      try {
        const { ProductWhatsAppNotificationService } = require('../../../products/services/product-whatsapp-notification.service');
        return ProductWhatsAppNotificationService;
      } catch {
        return null;
      }
    }))
    private readonly productWhatsAppNotificationService?: any,
    private readonly configService?: ConfigService,
  ) {}

  async execute(qrCodeData: string, validatedBy: string): Promise<OrderItem> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando validação de QR code de produto', {
      qrCodeData: qrCodeData.substring(0, 50),
      validatedBy,
      timestamp: new Date().toISOString(),
    });

    try {
      // Buscar item pelo QR code
      const orderItem = await this.orderItemRepository.findByQrCodeData(qrCodeData);
      if (!orderItem) {
        throw new InvalidOperationException(
          'Validate product QR',
          'Product QR code not found'
        );
      }

      // Verificar se já foi validado
      if (orderItem.isValidated()) {
        throw new InvalidOperationException(
          'Validate product QR',
          'Product QR code already validated'
        );
      }

      // Verificar se o pedido está confirmado
      if (orderItem.order.status !== OrderStatus.CONFIRMED) {
        throw new InvalidOperationException(
          'Validate product QR',
          `Order ${orderItem.order.id} is not confirmed`
        );
      }

      // Validar item
      orderItem.validate(validatedBy);
      const savedItem = await this.orderItemRepository.save(orderItem);

      const duration = Date.now() - startTime;
      this.logger.info('QR code de produto validado com sucesso', {
        orderItemId: savedItem.id,
        orderId: savedItem.order.id,
        productId: savedItem.productId,
        validatedBy,
        duration,
      });

      // Enviar notificação WhatsApp após validação (fire-and-forget)
      if (this.productWhatsAppNotificationService && savedItem.order.userId) {
        try {
          // Buscar dados completos: usuário e produto
          const user = await this.userRepository.findById(savedItem.order.userId);
          const product = await this.productRepository.findById(savedItem.productId);

          if (user && product && user.whatsappNumber) {
            const instanceName = this.configService?.get<string>('EVOLUTION_INSTANCE_NAME') || 
                                this.configService?.get<string>('EVOLUTION_INSTANCE') || 
                                'Gwan';

            // Enviar de forma assíncrona sem bloquear o fluxo principal
            this.productWhatsAppNotificationService
              .sendProductValidationNotification(savedItem, product, user, instanceName)
              .catch((error: any) => {
                this.logger.error('Erro ao enviar notificação WhatsApp de validação', {
                  orderItemId: savedItem.id,
                  productId: product.id,
                  userId: user.id,
                  error: error instanceof Error ? error.message : String(error),
                });
              });
          }
        } catch (notificationError) {
          // Logar erro mas não propagar - não deve interromper o fluxo principal
          this.logger.error('Erro ao buscar dados para notificação WhatsApp de validação', {
            orderItemId: savedItem.id,
            error: notificationError instanceof Error ? notificationError.message : String(notificationError),
          });
        }
      }

      return savedItem;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao validar QR code de produto', {
        qrCodeData: qrCodeData.substring(0, 50),
        validatedBy,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

