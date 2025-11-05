import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';

@Injectable()
export class GetEventByIdUseCase {
  private readonly cacheTtl = 5 * 60; // 5 minutos em segundos

  constructor(
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(eventId: string): Promise<Event> {
    const startTime = Date.now();
    const cacheKey = `event:byId:${eventId}`;
    
    this.logger.info('Buscando evento por ID', {
      eventId,
      timestamp: new Date().toISOString(),
    });

    // Verificar cache antes de consultar banco
    try {
      const cachedEvent = await this.cacheManager.get<Event>(cacheKey);
      if (cachedEvent) {
        const duration = Date.now() - startTime;
        this.logger.info('Evento encontrado no cache Redis', {
          eventId,
          title: cachedEvent.title,
          duration,
        });
        return cachedEvent;
      }
    } catch (error) {
      // Se Redis não estiver disponível, continuar sem cache
      this.logger.warn('[CACHE] Erro ao verificar cache Redis, continuando sem cache', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new EventNotFoundException(eventId);
      }

      // Salvar no cache Redis
      try {
        await this.cacheManager.set(cacheKey, event, this.cacheTtl);
        this.logger.debug('Evento cacheado no Redis', {
          eventId,
          ttl: this.cacheTtl,
        });
      } catch (error) {
        // Se Redis não estiver disponível, continuar sem cache
        this.logger.warn('[CACHE] Erro ao salvar evento no cache Redis, continuando sem cache', {
          eventId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      const duration = Date.now() - startTime;
      this.logger.info('Evento encontrado com sucesso', {
        eventId,
        title: event.title,
        duration,
      });

      return event;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar evento', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }
}
