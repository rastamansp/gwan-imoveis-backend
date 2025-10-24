import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { CreateEventDto } from '../../presentation/dtos/create-event.dto';
import { EventStatus } from '../../domain/value-objects/event-status.enum';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
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
        throw new Error('User does not have permission to create events');
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

      // Salvar evento
      const savedEvent = await this.eventRepository.save(event);

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
}
