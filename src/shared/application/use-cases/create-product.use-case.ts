import { Injectable, Inject } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository } from '../../domain/interfaces/product-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';
import { InvalidOperationException } from '../../domain/exceptions/invalid-operation.exception';
import { ProductCategory } from '../../domain/value-objects/product-category.enum';

export interface CreateProductCommand {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  image?: string;
  isActive?: boolean;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(command: CreateProductCommand, organizerId: string): Promise<Product> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando criação de produto', {
      eventId: command.eventId,
      name: command.name,
      price: command.price,
      category: command.category,
      organizerId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o evento existe
      const event = await this.eventRepository.findById(command.eventId);
      if (!event) {
        throw new EventNotFoundException(command.eventId);
      }

      // Verificar se o organizador é o dono do evento
      if (event.organizerId !== organizerId) {
        throw new InvalidOperationException(
          'Create product',
          'Only event organizer can create products'
        );
      }

      // Validar preço
      if (command.price <= 0) {
        throw new InvalidOperationException(
          'Create product',
          'Price must be greater than zero'
        );
      }

      // Criar produto
      const product = Product.create(
        command.eventId,
        command.name,
        command.price,
        command.category,
        command.description,
        command.image,
        command.isActive !== undefined ? command.isActive : true,
      );

      const savedProduct = await this.productRepository.save(product);

      const duration = Date.now() - startTime;
      this.logger.info('Produto criado com sucesso', {
        productId: savedProduct.id,
        eventId: command.eventId,
        name: command.name,
        duration,
      });

      return savedProduct;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao criar produto', {
        eventId: command.eventId,
        name: command.name,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

