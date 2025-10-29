import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ITicketCategoryRepository } from '../../domain/interfaces/ticket-category-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { IEmbeddingService } from '../interfaces/embedding-service.interface';
import { EventContentService } from '../../infrastructure/services/event-content.service';
import { CreateEventDto } from '../../presentation/dtos/create-event.dto';
import { EventStatus } from '../../domain/value-objects/event-status.enum';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITicketCategoryRepository')
    private readonly ticketCategoryRepository: ITicketCategoryRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    @Inject('IEmbeddingService')
    private readonly embeddingService: IEmbeddingService,
    private readonly eventContentService: EventContentService,
  ) {}

  async execute(createEventDto: CreateEventDto, organizerId: string): Promise<Event> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando criação de evento', {
      title: createEventDto.title,
      organizerId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o organizador existe
      const organizer = await this.userRepository.findById(organizerId);
      if (!organizer) {
        throw new UserNotFoundException(organizerId);
      }

      // Verificar se o organizador pode criar eventos
      if (!organizer.canCreateEvents()) {
        this.logger.warn('Usuário tentou criar evento sem permissão', {
          organizerId,
          organizerRole: organizer.role,
          organizerEmail: organizer.email,
        });
        throw new InsufficientPermissionsException('User does not have permission to create events');
      }

      // Criar evento
      const event = Event.create(
        uuidv4(),
        createEventDto.title,
        createEventDto.description,
        new Date(createEventDto.date),
        createEventDto.location,
        createEventDto.address,
        createEventDto.city,
        createEventDto.state,
        createEventDto.image,
        createEventDto.category,
        organizerId,
        organizer.name,
        EventStatus.ACTIVE,
        createEventDto.maxCapacity || 0,
        0,
        new Date(),
        new Date(),
      );

      // Gerar código amigável único (ex.: EVT-A1B2C3)
      event.code = await this.generateUniqueEventCode();

      // Salvar evento
      const savedEvent = await this.eventRepository.save(event);

      // Gerar embeddings em background (não bloquear criação do evento)
      this.generateEventEmbedding(savedEvent.id).catch(error => {
        this.logger.error('Erro ao gerar embedding do evento', {
          eventId: savedEvent.id,
          error: error.message,
        });
      });

      const duration = Date.now() - startTime;
      this.logger.info('Evento criado com sucesso', {
        eventId: savedEvent.id,
        title: savedEvent.title,
        organizerId,
        duration,
      });

      return savedEvent;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao criar evento', {
        title: createEventDto.title,
        organizerId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
  
  private async generateUniqueEventCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = this.generateEventCode();
      const exists = await this.eventRepository.findByCode(code);
      if (!exists) return code;
    }
    // Em caso improvável de colisões sucessivas, acrescenta sufixo
    return `${this.generateEventCode()}${Math.floor(Math.random()*10)}`.slice(0, 16);
  }

  private generateEventCode(): string {
    const prefix = 'EVT-';
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return prefix + rand;
  }

  /**
   * Gera embedding e metadados para o evento
   * Executado de forma assíncrona após criação/atualização
   */
  private async generateEventEmbedding(eventId: string): Promise<void> {
    try {
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        this.logger.warn('Evento não encontrado para gerar embedding', { eventId });
        return;
      }

      // Buscar categorias de ingressos relacionadas
      const categories = await this.ticketCategoryRepository.findByEventId(eventId);

      // Construir metadados
      const metadata = this.eventContentService.buildEventMetadata(event, categories);

      // Gerar texto consolidado
      const textContent = this.eventContentService.buildTextContent(event, categories);

      // Gerar embedding
      const embedding = await this.embeddingService.generateEmbedding(textContent);
      const model = this.embeddingService.getModel();

      // Atualizar evento com metadata e embedding
      await this.eventRepository.updateEmbedding(eventId, metadata, embedding, model);

      this.logger.debug('Embedding gerado com sucesso', {
        eventId,
        embeddingDimension: embedding.length,
        model,
      });
    } catch (error) {
      this.logger.error('Erro ao gerar embedding do evento', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Não propagar erro para não quebrar criação/atualização do evento
    }
  }
}
