import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseType, FormattedResponse } from '../../interfaces/chat-response.interface';
import { PaginationService } from './pagination.service';
import { SuggestionsService } from '../suggestions.service';
import { ILogger } from '../../../shared/application/interfaces/logger.interface';
import { GetEventByIdUseCase } from '../../../shared/application/use-cases/get-event-by-id.use-case';
import { ITicketCategoryRepository } from '../../../shared/domain/interfaces/ticket-category-repository.interface';
import { Event } from '../../../shared/domain/entities/event.entity';
import { TicketCategory } from '../../../shared/domain/entities/ticket-category.entity';

@Injectable()
export class WebFormatterService {
  private readonly defaultEventLimit = 5; // Limite padrão de eventos para listar
  private readonly frontendUrl: string;

  constructor(
    private readonly paginationService: PaginationService,
    private readonly suggestionsService: SuggestionsService,
    private readonly configService: ConfigService,
    private readonly getEventByIdUseCase: GetEventByIdUseCase,
    @Inject('ITicketCategoryRepository')
    private readonly ticketCategoryRepository: ITicketCategoryRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://events.gwan.com.br/events';
  }

  /**
   * Formata resposta para Web (retorna JSON estruturado)
   */
  async format(rawResponse: string, toolsUsed: { name: string; arguments?: Record<string, unknown> }[], rawData?: any): Promise<FormattedResponse> {
    const responseType = this.detectResponseType(toolsUsed);
    
    try {
      switch (responseType) {
        case 'event_list':
          return await this.formatEventList(rawResponse, rawData, toolsUsed);
        
        case 'event_detail':
          return await this.formatEventDetail(rawResponse, rawData, toolsUsed);
        
        case 'artist_list':
          return this.formatArtistList(rawResponse, rawData, toolsUsed);
        
        case 'artist_detail':
          return this.formatArtistDetail(rawResponse, rawData, toolsUsed);
        
        case 'ticket_prices':
          return this.formatTicketPrices(rawResponse, rawData, toolsUsed);
        
        default:
          return this.formatGeneric(rawResponse, toolsUsed);
      }
    } catch (error) {
      this.logger.error('Erro ao formatar resposta para Web', {
        error: error instanceof Error ? error.message : String(error),
        responseType,
      });
      return this.formatGeneric(rawResponse, toolsUsed);
    }
  }

  private detectResponseType(toolsUsed: { name: string; arguments?: Record<string, unknown> }[]): ResponseType {
    if (!toolsUsed || toolsUsed.length === 0) {
      return 'generic';
    }

    const lastTool = toolsUsed[toolsUsed.length - 1].name.toLowerCase();
    
    if (lastTool.includes('list_events') || 
        lastTool.includes('events.search') || 
        lastTool.includes('events_search') ||
        lastTool.includes('search_events')) {
      return 'event_list';
    }
    
    if (lastTool.includes('get_event_by_id') || lastTool.includes('event_detail')) {
      return 'event_detail';
    }
    
    if (lastTool.includes('list_artists') || lastTool.includes('artists.list') || lastTool.includes('search_artists')) {
      return 'artist_list';
    }
    
    if (lastTool.includes('get_artist_by_id') || lastTool.includes('artist_detail')) {
      return 'artist_detail';
    }
    
    if (lastTool.includes('ticket') || lastTool.includes('price')) {
      return 'ticket_prices';
    }
    
    return 'generic';
  }

  private async formatEventList(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    let events: any[] = [];
    
    if (rawData && Array.isArray(rawData)) {
      events = rawData;
    } else if (rawData?.events) {
      events = Array.isArray(rawData.events) ? rawData.events : [rawData.events];
    } else if (rawData?.data) {
      events = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
    }

    // Limitar quantidade de eventos
    const limitedEvents = events.slice(0, this.defaultEventLimit);
    
    // Buscar detalhes completos de cada evento
    const enrichedEvents: Array<{ event: Event; categories: TicketCategory[] }> = [];

    for (const eventData of limitedEvents) {
      try {
        const eventId = eventData.id || eventData.eventId;
        if (!eventId) {
          this.logger.warn('Evento sem ID, pulando enriquecimento', { eventData });
          continue;
        }

        // Buscar detalhes completos do evento
        const event = await this.getEventByIdUseCase.execute(eventId);
        
        // Buscar categorias de ingressos
        const categories = await this.ticketCategoryRepository.findByEventId(eventId);
        
        enrichedEvents.push({ event, categories });
      } catch (error) {
        this.logger.error('Erro ao enriquecer evento com detalhes', {
          eventId: eventData.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continuar mesmo se falhar
      }
    }

    const suggestions = this.suggestionsService.generateContextualSuggestions('event_list', { 
      events: enrichedEvents.map(e => e.event) 
    });

    return {
      answer: rawResponse,
      data: {
        type: 'event_list',
        items: enrichedEvents.map(({ event, categories }) => ({
          ...event,
          ticketCategories: categories,
          eventLink: `${this.frontendUrl}/${event.id}`,
        })),
        pagination: {
          current: 1,
          total: Math.ceil(events.length / this.defaultEventLimit),
          pageSize: this.defaultEventLimit,
          hasMore: events.length > this.defaultEventLimit,
        },
        suggestions,
        rawData: events,
      },
    };
  }

  private async formatEventDetail(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    const event = rawData && !Array.isArray(rawData) ? rawData : (rawData?.[0] || rawData?.data?.[0]);
    
    if (!event) {
      return this.formatGeneric(rawResponse, toolsUsed);
    }

    try {
      const eventId = event.id || event.eventId;
      
      let enrichedEvent: Event;
      let categories: TicketCategory[] = [];
      
      if (eventId) {
        // Buscar detalhes completos
        enrichedEvent = await this.getEventByIdUseCase.execute(eventId);
        categories = await this.ticketCategoryRepository.findByEventId(eventId);
      } else {
        // Usar dados básicos disponíveis
        enrichedEvent = event as Event;
        if (event.ticketCategories) {
          categories = Array.isArray(event.ticketCategories) ? event.ticketCategories : [];
        }
      }

      const suggestions = this.suggestionsService.generateContextualSuggestions('event_detail', {
        hasArtists: !!enrichedEvent.artists && enrichedEvent.artists.length > 0,
      });

      return {
        answer: rawResponse,
        data: {
          type: 'event_detail',
          items: [{ 
            ...enrichedEvent, 
            ticketCategories: categories,
            eventLink: `${this.frontendUrl}/${enrichedEvent.id}`,
          }],
          suggestions,
          rawData: enrichedEvent,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao formatar detalhes do evento', {
        error: error instanceof Error ? error.message : String(error),
        event,
      });
      
      // Fallback: usar dados básicos
      return this.formatGeneric(rawResponse, toolsUsed);
    }
  }

  private formatArtistList(rawResponse: string, rawData: any, toolsUsed: any[]): FormattedResponse {
    let artists: any[] = [];
    
    if (rawData && Array.isArray(rawData)) {
      artists = rawData;
    } else if (rawData?.artists) {
      artists = Array.isArray(rawData.artists) ? rawData.artists : [rawData.artists];
    } else if (rawData?.data) {
      artists = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
    }

    const page = 1;
    const pageSize = 10;
    const { items: paginatedArtists, pagination } = this.paginationService.paginateItems(artists, page, pageSize);

    const suggestions = this.suggestionsService.generateContextualSuggestions('artist_list', { artists: paginatedArtists });

    return {
      answer: rawResponse,
      data: {
        type: 'artist_list',
        items: paginatedArtists,
        pagination: {
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          hasMore: pagination.hasMore,
        },
        suggestions,
        rawData: artists,
      },
    };
  }

  private formatArtistDetail(rawResponse: string, rawData: any, toolsUsed: any[]): FormattedResponse {
    const artist = rawData && !Array.isArray(rawData) ? rawData : (rawData?.[0] || rawData?.data?.[0]);
    
    if (!artist) {
      return this.formatGeneric(rawResponse, toolsUsed);
    }

    const suggestions = this.suggestionsService.generateContextualSuggestions('artist_detail', artist);

    return {
      answer: rawResponse,
      data: {
        type: 'artist_detail',
        items: [artist],
        suggestions,
        rawData: artist,
      },
    };
  }

  private formatTicketPrices(rawResponse: string, rawData: any, toolsUsed: any[]): FormattedResponse {
    let categories: any[] = [];
    
    if (rawData && Array.isArray(rawData)) {
      categories = rawData;
    } else if (rawData?.categories) {
      categories = Array.isArray(rawData.categories) ? rawData.categories : [rawData.categories];
    } else if (rawData?.data) {
      categories = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
    }

    const suggestions = this.suggestionsService.generateContextualSuggestions('ticket_prices', { categories });

    return {
      answer: rawResponse,
      data: {
        type: 'ticket_prices',
        items: categories,
        suggestions,
        rawData: categories,
      },
    };
  }

  private formatGeneric(rawResponse: string, toolsUsed: any[]): FormattedResponse {
    const suggestions = this.suggestionsService.generateSuggestions('generic');
    
    return {
      answer: rawResponse,
      data: {
        type: 'generic',
        suggestions,
      },
    };
  }
}

