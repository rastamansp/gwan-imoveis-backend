import { Injectable, Inject } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository } from '../../domain/interfaces/product-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';

@Injectable()
export class GetEventProductsUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(eventId: string, activeOnly: boolean = true): Promise<Product[]> {
    const startTime = Date.now();
    
    this.logger.info('Consultando produtos do evento', {
      eventId,
      activeOnly,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o evento existe
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new EventNotFoundException(eventId);
      }

      // Buscar produtos
      const products = activeOnly
        ? await this.productRepository.findByEventIdAndActive(eventId)
        : await this.productRepository.findByEventId(eventId);

      const duration = Date.now() - startTime;
      this.logger.info('Produtos consultados com sucesso', {
        eventId,
        count: products.length,
        duration,
      });

      return products;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao consultar produtos', {
        eventId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

