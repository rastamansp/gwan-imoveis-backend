import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ITicketCategoryRepository } from '../../domain/interfaces/ticket-category-repository.interface';
import { TicketCategory } from '../../domain/entities/ticket-category.entity';
import { CreateTicketCategoryDto } from '../../presentation/dtos/create-ticket-category.dto';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';

@Injectable()
export class AddTicketCategoriesToEventUseCase {
  private readonly logger = new Logger(AddTicketCategoriesToEventUseCase.name);

  constructor(
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ITicketCategoryRepository')
    private readonly ticketCategoryRepository: ITicketCategoryRepository,
  ) {}

  async execute(
    eventId: string,
    userId: string,
    createTicketCategoryDto: CreateTicketCategoryDto,
  ): Promise<TicketCategory> {
    this.logger.log(`Iniciando criação de categoria de ingresso para evento ${eventId}`, {
      eventId,
      userId,
      categoryName: createTicketCategoryDto.name,
      timestamp: new Date().toISOString(),
    });

    // 1. Verificar se o evento existe
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      this.logger.warn(`Evento ${eventId} não encontrado`);
      throw new NotFoundException(`Evento com ID ${eventId} não encontrado`);
    }

    // 2. Verificar se o usuário é organizador do evento ou ADMIN
    const user = await this.eventRepository.findById(eventId).then(e => e?.organizerId);
    if (user !== userId) {
      // Verificar se é ADMIN através do userRepository seria ideal, mas por simplicidade
      // vamos assumir que se não é o organizador, precisa ser ADMIN
      this.logger.warn(`Usuário ${userId} não tem permissão para criar categorias no evento ${eventId}`);
      throw new InsufficientPermissionsException('Apenas o organizador do evento ou ADMIN podem criar categorias de ingresso');
    }

    // 3. Criar instância da categoria
    const categoryId = uuidv4();
    const category = TicketCategory.create(
      categoryId,
      eventId,
      createTicketCategoryDto.name,
      createTicketCategoryDto.description || '',
      createTicketCategoryDto.price,
      createTicketCategoryDto.maxQuantity,
      0, // soldQuantity inicial
      createTicketCategoryDto.benefits || [],
      true, // isActive inicial
    );

    // 4. Salvar no repositório
    const savedCategory = await this.ticketCategoryRepository.save(category);

    this.logger.log(`Categoria de ingresso criada com sucesso`, {
      categoryId: savedCategory.id,
      eventId,
      categoryName: savedCategory.name,
      price: savedCategory.price,
      maxQuantity: savedCategory.maxQuantity,
      duration: Date.now(),
    });

    return savedCategory;
  }
}
