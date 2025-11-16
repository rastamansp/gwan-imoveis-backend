import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseType, FormattedResponse } from '../../interfaces/chat-response.interface';
import { PaginationService } from './pagination.service';
import { SuggestionsService } from '../suggestions.service';
import { ILogger } from '../../../shared/application/interfaces/logger.interface';
// Imports removidos - serão atualizados quando o chat for adaptado para imóveis

@Injectable()
export class WebFormatterService {
  private readonly defaultEventLimit = 5; // Limite padrão de eventos para listar
  private readonly frontendUrl: string;

  constructor(
    private readonly paginationService: PaginationService,
    private readonly suggestionsService: SuggestionsService,
    private readonly configService: ConfigService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://litoralimoveis.com.br/';
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
    // TODO: Atualizar para trabalhar com imóveis quando o módulo for implementado
    // Por enquanto, retorna resposta genérica
    this.logger.warn('formatEventList chamado - será atualizado para imóveis', { rawData });
    return this.formatGeneric(rawResponse, toolsUsed);
  }

  private async formatEventDetail(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    // TODO: Atualizar para trabalhar com imóveis quando o módulo for implementado
    // Por enquanto, retorna resposta genérica
    this.logger.warn('formatEventDetail chamado - será atualizado para imóveis', { rawData });
    return this.formatGeneric(rawResponse, toolsUsed);
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

