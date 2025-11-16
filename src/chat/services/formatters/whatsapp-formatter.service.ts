import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageChannel } from '../../../shared/domain/value-objects/message-channel.enum';
import { ResponseType, FormattedResponse } from '../../interfaces/chat-response.interface';
import { PaginationService } from './pagination.service';
import { SuggestionsService } from '../suggestions.service';
import { ILogger } from '../../../shared/application/interfaces/logger.interface';
// Imports removidos - serão atualizados quando o chat for adaptado para imóveis

@Injectable()
export class WhatsAppFormatterService {
  private readonly maxMessageLength = 4000; // Limite seguro para WhatsApp
  private readonly maxCaptionLength = 1024; // Limite de caption no WhatsApp
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
   * Formata resposta para WhatsApp
   */
  async format(rawResponse: string, toolsUsed: { name: string; arguments?: Record<string, unknown> }[], rawData?: any): Promise<FormattedResponse> {
    const responseType = this.detectResponseType(toolsUsed);
    
    this.logger.debug('Formatando resposta para WhatsApp', {
      responseType,
      toolsUsedCount: toolsUsed?.length || 0,
      lastTool: toolsUsed?.length > 0 ? toolsUsed[toolsUsed.length - 1].name : 'none',
      hasRawData: !!rawData,
      rawDataType: rawData ? typeof rawData : 'undefined',
      rawDataIsArray: Array.isArray(rawData),
      rawDataKeys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : [],
    });
    
    try {
      switch (responseType) {
        
        
        default:
          this.logger.debug('Usando formato genérico', { responseType, toolsUsed });
          return this.formatGeneric(rawResponse, toolsUsed);
      }
    } catch (error) {
      this.logger.error('Erro ao formatar resposta para WhatsApp', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        responseType,
        rawData: rawData ? JSON.stringify(rawData).substring(0, 500) : 'null',
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
      // Verificar se é busca de ingressos do usuário
      if (lastTool.includes('user_tickets') || lastTool.includes('get_user_tickets')) {
        return 'user_tickets';
      }
      return 'ticket_prices';
    }
    
    return 'generic';
  }

  private async formatEventList(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    let events: any[] = [];
    
    this.logger.debug('Formatando lista de eventos', {
      rawDataType: rawData ? typeof rawData : 'undefined',
      rawDataIsArray: Array.isArray(rawData),
      rawDataKeys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : [],
    });
    
    // Tentar extrair eventos dos dados
    if (rawData && Array.isArray(rawData)) {
      events = rawData;
    } else if (rawData?.events) {
      events = Array.isArray(rawData.events) ? rawData.events : [rawData.events];
    } else if (rawData?.data) {
      events = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
    } else if (rawData && typeof rawData === 'object') {
      // Tentar encontrar arrays dentro do objeto
      for (const key of Object.keys(rawData)) {
        if (Array.isArray(rawData[key])) {
          events = rawData[key];
          break;
        }
      }
    }

    this.logger.debug('Eventos extraídos', {
      eventsCount: events.length,
      eventIds: events.slice(0, 5).map((e: any) => e?.id || e?.eventId || 'no-id'),
    });

    // Remover duplicatas baseado no ID do evento
    const uniqueEvents = events.filter((event, index, self) => {
      const eventId = event.id || event.eventId;
      if (!eventId) return false; // Remover eventos sem ID
      return index === self.findIndex(e => (e.id || e.eventId) === eventId);
    });

    this.logger.debug('Eventos após remoção de duplicatas', {
      originalCount: events.length,
      uniqueCount: uniqueEvents.length,
      duplicatesRemoved: events.length - uniqueEvents.length,
    });

    // Limitar quantidade de eventos
    const limitedEvents = uniqueEvents.slice(0, this.defaultEventLimit);
    
    // Se não há eventos, retornar mensagem apropriada
    if (limitedEvents.length === 0) {
      this.logger.warn('Nenhum evento encontrado em rawData', { rawData });
      return {
        answer: '❌ Não encontrei eventos cadastrados no momento.',
        data: {
          type: 'event_list',
          items: [],
          rawData: rawData,
        },
      };
    }
    
    // TODO: Atualizar para trabalhar com imóveis quando o módulo for implementado
    // Por enquanto, retorna resposta genérica
    this.logger.warn('formatEventList chamado - será atualizado para imóveis', { events: limitedEvents });
    return {
      answer: rawResponse || 'Lista de itens disponíveis',
      data: {
        type: 'generic',
        items: limitedEvents,
        rawData: limitedEvents,
      },
    };
  }


  

  private formatGeneric(rawResponse: string, toolsUsed: any[]): FormattedResponse {
    return {
      answer: rawResponse,
      data: {
        type: 'generic',
      },
    };
  }

  private formatEventCaption(event: any): string {
    const caption = `${event.title || 'Evento'}\n`;
    let details = '';
    
    if (event.date) {
      const date = new Date(event.date);
      details += `📅 ${date.toLocaleDateString('pt-BR')}\n`;
    }
    
    if (event.location) {
      details += `📍 ${event.location}\n`;
    }
    
    const fullCaption = caption + details;
    return fullCaption.length > this.maxCaptionLength 
      ? fullCaption.substring(0, this.maxCaptionLength - 3) + '...' 
      : fullCaption;
  }

  private formatArtistCaption(artist: any): string {
    // TODO: Atualizar para trabalhar com imóveis quando o módulo for implementado
    return `Artista: ${artist.artisticName || artist.name || 'Sem nome'}`;
  }

  // Função removida - será atualizada para imóveis
  /*
  private formatArtistWithDetails(artist: Artist): string {
    let text = `🎤 *Artista: ${artist.artisticName || artist.name || 'Sem nome'}*\n\n`;

    // Redes Sociais
    const socialNetworks: string[] = [];
    if (artist.instagramUsername) socialNetworks.push(`Instagram: @${artist.instagramUsername}`);
    if (artist.youtubeUsername) socialNetworks.push(`YouTube: @${artist.youtubeUsername}`);
    if (artist.xUsername) socialNetworks.push(`X/Twitter: @${artist.xUsername}`);
    if (artist.spotifyUsername) socialNetworks.push(`Spotify: @${artist.spotifyUsername}`);
    if (artist.tiktokUsername) socialNetworks.push(`TikTok: @${artist.tiktokUsername}`);

    if (socialNetworks.length > 0) {
      text += `📱 *Redes Sociais:*\n${socialNetworks.join('\n')}\n\n`;
    }

    // Dados do Spotify (se disponível)
    const spotifyData = artist.metadata?.spotify;
    if (spotifyData) {
      if (spotifyData.followers?.total !== undefined) {
        const followers = spotifyData.followers.total.toLocaleString('pt-BR');
        text += `👥 *Seguidores:* ${followers}\n`;
      }
      
      if (spotifyData.popularity !== undefined) {
        text += `⭐ *Popularidade:* ${spotifyData.popularity}/100\n`;
      }
      
      if (spotifyData.genres && Array.isArray(spotifyData.genres) && spotifyData.genres.length > 0) {
        text += `🎵 *Gêneros:*\n${spotifyData.genres.join(', ')}\n\n`;
      }
    }

    // Eventos
    if (artist.events && artist.events.length > 0) {
      const eventNames = artist.events.map(e => e.title).join(', ');
      text += `🎪 *Eventos:*\n${eventNames}\n`;
    } else {
      text += `🎪 *Eventos:*\nNenhum evento cadastrado no momento.\n`;
    }

    // Link para a página do artista
    const baseUrl = this.frontendUrl.endsWith('/') ? this.frontendUrl : `${this.frontendUrl}/`;
    const artistLink = `${baseUrl}artists/${artist.id}`;
    text += `\n🔗 ${artistLink}`;

    // Limitar tamanho do caption
    if (text.length > this.maxCaptionLength) {
      text = text.substring(0, this.maxCaptionLength - 3) + '...';
    }

    return text;
  }
  */
}

