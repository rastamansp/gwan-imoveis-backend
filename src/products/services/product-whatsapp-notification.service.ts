import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { EvolutionApiService } from '../../whatsapp-webhook/services/evolution-api.service';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { normalizeNumberForEvolutionSDK } from '../../shared/infrastructure/utils/whatsapp.utils';
import { OrderItem } from '../../shared/domain/entities/order-item.entity';
import { Product } from '../../shared/domain/entities/product.entity';
import { User } from '../../shared/domain/entities/user.entity';

@Injectable()
export class ProductWhatsAppNotificationService {
  constructor(
    private readonly evolutionApiService: EvolutionApiService,
    private readonly configService: ConfigService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Envia notificação WhatsApp após compra de produto
   * @param orderItem Item do pedido comprado
   * @param product Produto comprado
   * @param user Usuário que comprou
   * @param instanceName Nome da instância do Evolution API
   */
  async sendProductPurchaseNotification(
    orderItem: OrderItem,
    product: Product,
    user: User,
    instanceName: string,
  ): Promise<void> {
    const startTime = Date.now();

    // Verificar se usuário tem WhatsApp cadastrado
    if (!user.whatsappNumber) {
      this.logger.debug('[WHATSAPP_PRODUCT] Usuário não tem WhatsApp cadastrado, pulando notificação', {
        userId: user.id,
        orderItemId: orderItem.id,
      });
      return;
    }

    try {
      // Normalizar número WhatsApp
      const normalizedNumber = normalizeNumberForEvolutionSDK(user.whatsappNumber);
      
      // Verificar se Evolution API está acessível
      const evolutionUrl = this.configService.get<string>('EVOLUTION_INSTANCE_URL') || 'http://localhost:8080';
      try {
        await axios.get(`${evolutionUrl}/health`, { timeout: 3000 }).catch(() => {
          // Ignorar erro de health check - pode não ter endpoint /health
        });
      } catch (healthError) {
        // Não bloquear se health check falhar
      }

      this.logger.info('[WHATSAPP_PRODUCT] Enviando notificação de compra de produto', {
        userId: user.id,
        whatsappNumber: normalizedNumber,
        orderItemId: orderItem.id,
        productId: product.id,
        productName: product.name,
        instanceName,
      });

      // Formatar mensagem de compra
      const message = this.formatPurchaseMessage(product, orderItem);

      // Enviar foto do produto se disponível
      if (product.image) {
        try {
          // Se a imagem for uma URL externa (http/https), baixar e converter para base64 primeiro
          let imageToSend = product.image;
          if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
            try {
              this.logger.debug('[WHATSAPP_PRODUCT] Baixando imagem externa para converter em base64', {
                productId: product.id,
                imageUrl: product.image.substring(0, 100),
              });
              
              // Baixar imagem externa e converter para base64
              const response = await axios.get(product.image, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
              });
              
              const buffer = Buffer.from(response.data);
              const base64 = buffer.toString('base64');
              const mimetype = response.headers['content-type'] || 'image/jpeg';
              imageToSend = `data:${mimetype};base64,${base64}`;
              
              this.logger.debug('[WHATSAPP_PRODUCT] Imagem convertida para base64 com sucesso', {
                productId: product.id,
                mimetype,
                base64Length: base64.length,
              });
            } catch (downloadError) {
              this.logger.warn('[WHATSAPP_PRODUCT] Erro ao baixar imagem externa, tentando enviar URL diretamente', {
                productId: product.id,
                error: downloadError instanceof Error ? downloadError.message : String(downloadError),
              });
              // Continuar com a URL original
            }
          }
          
          await this.evolutionApiService.sendImageMessage(
            instanceName,
            normalizedNumber,
            imageToSend,
            message,
          );
        } catch (imageError) {
          // Se falhar ao enviar com imagem, tentar enviar apenas texto
          this.logger.warn('[WHATSAPP_PRODUCT] Erro ao enviar imagem do produto, enviando apenas texto', {
            productId: product.id,
            error: imageError instanceof Error ? imageError.message : String(imageError),
          });
          try {
            await this.evolutionApiService.sendTextMessage(instanceName, normalizedNumber, message);
          } catch (textError) {
            this.logger.error('[WHATSAPP_PRODUCT] Erro ao enviar mensagem de texto também', {
              productId: product.id,
              error: textError instanceof Error ? textError.message : String(textError),
            });
            // Não propagar erro - não deve interromper o fluxo principal
          }
        }
      } else {
        // Enviar apenas texto se não houver imagem
        try {
          await this.evolutionApiService.sendTextMessage(instanceName, normalizedNumber, message);
        } catch (textError) {
          this.logger.error('[WHATSAPP_PRODUCT] Erro ao enviar mensagem de texto', {
            productId: product.id,
            error: textError instanceof Error ? textError.message : String(textError),
          });
          // Não propagar erro - não deve interromper o fluxo principal
        }
      }

      // Enviar QR code do produto IMEDIATAMENTE após o produto
      if (orderItem.qrCodeImage) {
        try {
          // Pequeno delay entre produto e QR code (500ms)
          await new Promise(resolve => setTimeout(resolve, 500));

          const qrCaption = '📱 Escaneie este QR code para retirar seu produto no bar!';
          await this.evolutionApiService.sendImageMessage(
            instanceName,
            normalizedNumber,
            orderItem.qrCodeImage,
            qrCaption,
          );
        } catch (qrError) {
          this.logger.error('[WHATSAPP_PRODUCT] Erro ao enviar QR code do produto', {
            orderItemId: orderItem.id,
            error: qrError instanceof Error ? qrError.message : String(qrError),
          });
          // Não propagar erro - mensagem principal já foi enviada
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info('[WHATSAPP_PRODUCT] Notificação de compra enviada com sucesso', {
        userId: user.id,
        orderItemId: orderItem.id,
        productId: product.id,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('[WHATSAPP_PRODUCT] Erro ao enviar notificação de compra', {
        userId: user.id,
        orderItemId: orderItem.id,
        productId: product.id,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      // Não propagar erro - não deve interromper o fluxo principal
    }
  }

  /**
   * Envia notificação WhatsApp após validação de produto
   * @param orderItem Item do pedido validado
   * @param product Produto validado
   * @param user Usuário que comprou
   * @param instanceName Nome da instância do Evolution API
   */
  async sendProductValidationNotification(
    orderItem: OrderItem,
    product: Product,
    user: User,
    instanceName: string,
  ): Promise<void> {
    const startTime = Date.now();

    // Verificar se usuário tem WhatsApp cadastrado
    if (!user.whatsappNumber) {
      this.logger.debug('[WHATSAPP_PRODUCT] Usuário não tem WhatsApp cadastrado, pulando notificação de validação', {
        userId: user.id,
        orderItemId: orderItem.id,
      });
      return;
    }

    try {
      // Normalizar número WhatsApp
      const normalizedNumber = normalizeNumberForEvolutionSDK(user.whatsappNumber);

      this.logger.info('[WHATSAPP_PRODUCT] Enviando notificação de validação de produto', {
        userId: user.id,
        whatsappNumber: normalizedNumber,
        orderItemId: orderItem.id,
        productId: product.id,
        productName: product.name,
        validatedAt: orderItem.validatedAt,
        instanceName,
      });

      // Formatar mensagem de validação
      const message = this.formatValidationMessage(product, orderItem);

      // Enviar mensagem de texto
      await this.evolutionApiService.sendTextMessage(instanceName, normalizedNumber, message);

      const duration = Date.now() - startTime;
      this.logger.info('[WHATSAPP_PRODUCT] Notificação de validação enviada com sucesso', {
        userId: user.id,
        orderItemId: orderItem.id,
        productId: product.id,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('[WHATSAPP_PRODUCT] Erro ao enviar notificação de validação', {
        userId: user.id,
        orderItemId: orderItem.id,
        productId: product.id,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      // Não propagar erro - não deve interromper o fluxo principal
    }
  }

  /**
   * Formata mensagem de compra de produto
   */
  private formatPurchaseMessage(product: Product, orderItem: OrderItem): string {
    const unitPrice = Number(orderItem.unitPrice).toFixed(2);
    const totalPrice = Number(orderItem.totalPrice).toFixed(2);
    const description = product.description || 'Sem descrição';

    return `📦 *Produto Comprado*

*${product.name}*
${description}

📊 *Detalhes:*
• Quantidade: ${orderItem.quantity}
• Preço Unitário: R$ ${unitPrice}
• Total: R$ ${totalPrice}

Escaneie o QR code abaixo para retirar seu produto no bar!`;
  }

  /**
   * Formata mensagem de validação de produto
   */
  private formatValidationMessage(product: Product, orderItem: OrderItem): string {
    const validatedAt = orderItem.validatedAt
      ? new Date(orderItem.validatedAt).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Agora';

    return `✅ *Produto Validado*

Seu produto *${product.name}* foi validado e está pronto para retirada!

📊 *Detalhes:*
• Quantidade: ${orderItem.quantity}
• Validado em: ${validatedAt}

Obrigado pela preferência!`;
  }
}

