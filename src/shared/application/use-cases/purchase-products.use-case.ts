import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { IOrderRepository, IOrderItemRepository } from '../../domain/interfaces/order-repository.interface';
import { IProductRepository } from '../../domain/interfaces/product-repository.interface';
import { IUserCreditRepository } from '../../domain/interfaces/user-credit-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { IQRCodeService } from '../interfaces/qrcode.interface';
import { ILogger } from '../interfaces/logger.interface';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';
import { InvalidOperationException } from '../../domain/exceptions/invalid-operation.exception';
import { ProductNotFoundException } from '../../domain/exceptions/product-not-found.exception';
import { v4 as uuidv4 } from 'uuid';

export interface PurchaseItem {
  productId: string;
  quantity: number;
}

export interface PurchaseProductsCommand {
  eventId: string;
  items: PurchaseItem[];
  ticketId?: string;
}

@Injectable()
export class PurchaseProductsUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IOrderItemRepository')
    private readonly orderItemRepository: IOrderItemRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IUserCreditRepository')
    private readonly userCreditRepository: IUserCreditRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IQRCodeService')
    private readonly qrCodeService: IQRCodeService,
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

  async execute(command: PurchaseProductsCommand, userId: string): Promise<Order> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando compra de produtos', {
      userId,
      eventId: command.eventId,
      itemsCount: command.items.length,
      ticketId: command.ticketId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o usuário existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // Verificar se o evento existe
      const event = await this.eventRepository.findById(command.eventId);
      if (!event) {
        throw new EventNotFoundException(command.eventId);
      }

      // Validar itens
      if (!command.items || command.items.length === 0) {
        throw new InvalidOperationException(
          'Purchase products',
          'Items list cannot be empty'
        );
      }

      // Buscar produtos e calcular total
      let totalAmount = 0;
      const productsMap = new Map<string, { product: any; quantity: number }>();

      for (const item of command.items) {
        if (item.quantity <= 0) {
          throw new InvalidOperationException(
            'Purchase products',
            'Quantity must be greater than zero'
          );
        }

        const product = await this.productRepository.findById(item.productId);
        if (!product) {
          throw new ProductNotFoundException(item.productId);
        }

        if (!product.belongsToEvent(command.eventId)) {
          throw new InvalidOperationException(
            'Purchase products',
            `Product ${item.productId} does not belong to event ${command.eventId}`
          );
        }

        if (!product.isActive) {
          throw new InvalidOperationException(
            'Purchase products',
            `Product ${item.productId} is not active`
          );
        }

        const itemTotal = product.getPrice() * item.quantity;
        totalAmount += itemTotal;
        productsMap.set(item.productId, { product, quantity: item.quantity });
      }

      // Verificar saldo suficiente
      const userCredit = await this.userCreditRepository.createOrGetByUserId(userId);
      if (!userCredit.hasEnoughCredit(totalAmount)) {
        throw new InvalidOperationException(
          'Purchase products',
          `Insufficient credit. Required: ${totalAmount}, Available: ${userCredit.getBalance()}`
        );
      }

      // Criar pedido
      const order = Order.create(
        userId,
        command.eventId,
        totalAmount,
        command.ticketId,
      );
      order.confirm();
      const savedOrder = await this.orderRepository.save(order);

      // Criar itens do pedido com QR codes
      const orderItems: OrderItem[] = [];
      const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

      for (const [productId, { product, quantity }] of productsMap) {
        // Gerar código único para QR code
        const qrCodeData = `PRODUCT_${uuidv4()}_${Date.now()}`;
        const validationUrl = `${apiBaseUrl}/api/products/validate?code=${encodeURIComponent(qrCodeData)}`;

        // Gerar QR code
        const qrCodeBase64 = await this.qrCodeService.generateQRCode(validationUrl);
        const qrCodeImage = `data:image/png;base64,${qrCodeBase64}`;

        // Criar item do pedido
        const orderItem = OrderItem.create(
          savedOrder.id,
          productId,
          quantity,
          product.getPrice(),
          qrCodeData,
          qrCodeImage,
        );

        const savedItem = await this.orderItemRepository.save(orderItem);
        orderItems.push(savedItem);
      }

      // Debitar créditos
      userCredit.deductCredit(totalAmount);
      await this.userCreditRepository.save(userCredit);

      // Atualizar pedido com itens
      savedOrder.items = orderItems;

      const duration = Date.now() - startTime;
      this.logger.info('Produtos comprados com sucesso', {
        orderId: savedOrder.id,
        userId,
        eventId: command.eventId,
        totalAmount,
        itemsCount: orderItems.length,
        newBalance: userCredit.getBalance(),
        duration,
      });

      // Enviar notificações WhatsApp para cada produto comprado (sequencialmente com delay)
      if (this.productWhatsAppNotificationService && user.whatsappNumber) {
        const instanceName = this.configService?.get<string>('EVOLUTION_INSTANCE_NAME') || 
                            this.configService?.get<string>('EVOLUTION_INSTANCE') || 
                            'Gwan';

        // Enviar notificação para cada item sequencialmente com delay entre eles
        // Isso garante que cada produto seja enviado com seu QR code antes do próximo
        for (let i = 0; i < orderItems.length; i++) {
          const orderItem = orderItems[i];
          
          // Buscar produto completo com imagem
          const product = await this.productRepository.findById(orderItem.productId);
          if (product) {
            // Enviar sequencialmente (await) para garantir ordem correta
            // Cada produto será enviado com seu QR code antes do próximo
            try {
              await this.productWhatsAppNotificationService.sendProductPurchaseNotification(
                orderItem,
                product,
                user,
                instanceName,
              );
            } catch (error: any) {
              // Logar erro mas continuar com próximo produto
              this.logger.error('Erro ao enviar notificação WhatsApp de compra', {
                orderItemId: orderItem.id,
                productId: product.id,
                userId: user.id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
            
            // Delay entre produtos (2 segundos) - apenas se não for o último item
            if (i < orderItems.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }

      return savedOrder;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao comprar produtos', {
        userId,
        eventId: command.eventId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

