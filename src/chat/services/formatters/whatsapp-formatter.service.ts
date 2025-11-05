import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageChannel } from '../../../shared/domain/value-objects/message-channel.enum';
import { ResponseType, FormattedResponse } from '../../interfaces/chat-response.interface';
import { PaginationService } from './pagination.service';
import { SuggestionsService } from '../suggestions.service';
import { ILogger } from '../../../shared/application/interfaces/logger.interface';
import { GetEventByIdUseCase } from '../../../shared/application/use-cases/get-event-by-id.use-case';
import { GetArtistByIdUseCase } from '../../../shared/application/use-cases/get-artist-by-id.use-case';
import { ITicketCategoryRepository } from '../../../shared/domain/interfaces/ticket-category-repository.interface';
import { Event } from '../../../shared/domain/entities/event.entity';
import { TicketCategory } from '../../../shared/domain/entities/ticket-category.entity';
import { Artist } from '../../../shared/domain/entities/artist.entity';

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
    private readonly getEventByIdUseCase: GetEventByIdUseCase,
    private readonly getArtistByIdUseCase: GetArtistByIdUseCase,
    @Inject('ITicketCategoryRepository')
    private readonly ticketCategoryRepository: ITicketCategoryRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://events.gwan.com.br/';
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
        case 'event_list':
          return await this.formatEventList(rawResponse, rawData, toolsUsed);
        
        case 'event_detail':
          return await this.formatEventDetail(rawResponse, rawData, toolsUsed);
        
        case 'artist_list':
          return await this.formatArtistList(rawResponse, rawData, toolsUsed);
        
        case 'artist_detail':
          return this.formatArtistDetail(rawResponse, rawData, toolsUsed);
        
        case 'ticket_prices':
          return this.formatTicketPrices(rawResponse, rawData, toolsUsed);
        
        case 'user_tickets':
          return await this.formatUserTicketsMessage(rawResponse, rawData, toolsUsed);
        
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
    
    // Buscar detalhes completos de cada evento
    return await this.formatEventListWithDetails(limitedEvents);
  }

  private async formatEventListWithDetails(events: any[]): Promise<FormattedResponse> {
    const enrichedEvents: Array<{ event: Event; categories: TicketCategory[] }> = [];
    const media: FormattedResponse['media'] = [];
    const eventTexts: string[] = [];
    const processedEventIds = new Set<string>(); // Rastrear IDs já processados

    // Enriquecer cada evento com detalhes completos e ingressos
    for (const eventData of events) {
      try {
        const eventId = eventData.id || eventData.eventId;
        if (!eventId) {
          this.logger.warn('Evento sem ID, pulando enriquecimento', { eventData });
          continue;
        }

        // Verificar se já processamos este evento
        if (processedEventIds.has(eventId)) {
          this.logger.debug('Evento duplicado detectado, pulando', { eventId });
          continue;
        }

        processedEventIds.add(eventId);

        // Buscar detalhes completos do evento
        const event = await this.getEventByIdUseCase.execute(eventId);
        
        // Buscar categorias de ingressos
        const categories = await this.ticketCategoryRepository.findByEventId(eventId);
        
        enrichedEvents.push({ event, categories });
        
        // Adicionar imagem e texto apenas se o evento tiver imagem
        if (event.image) {
          // Formatar texto do evento
          const eventMessage = this.formatEventWithEmojis(event, categories);
          eventTexts.push(eventMessage.text);
          
          // Adicionar imagem à lista de mídias
          media.push({
            type: 'image',
            url: event.image,
            caption: eventMessage.text, // Usar o texto formatado completo como caption
          });
        }
      } catch (error) {
        this.logger.error('Erro ao enriquecer evento com detalhes', {
          eventId: eventData.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continuar mesmo se falhar
      }
    }

    // Formatar texto inicial
    let introText = 'Aqui estão alguns eventos disponíveis:\n\n';
    
    if (enrichedEvents.length === 0) {
      return {
        answer: '❌ Não encontrei eventos cadastrados no momento.',
        data: {
          type: 'event_list',
          items: [],
          rawData: events,
        },
      };
    }
    
    // Texto final
    const finalText = '\n\nSe precisar de mais informações sobre algum evento específico, é só avisar!';

    return {
      answer: introText, // Apenas o texto inicial
      data: {
        type: 'event_list',
        items: enrichedEvents.map(({ event, categories }) => ({
          ...event,
          ticketCategories: categories,
        })),
        rawData: events,
        // Adicionar estrutura especial para envio sequencial
        eventTexts, // Textos formatados apenas dos eventos COM imagem (alinhado com media)
        finalText, // Texto final
      },
      media,
    };
  }

  private async formatEventDetail(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    const event = rawData && !Array.isArray(rawData) ? rawData : (rawData?.[0] || rawData?.data?.[0]);
    
    if (!event) {
      return this.formatGeneric(rawResponse, toolsUsed);
    }

    // Se já temos dados completos, formatar diretamente
    // Caso contrário, buscar detalhes completos
    return await this.formatEventDetailWithDetails(event);
  }

  private async formatEventDetailWithDetails(eventData: any): Promise<FormattedResponse> {
    try {
      const eventId = eventData.id || eventData.eventId;
      
      let event: Event;
      let categories: TicketCategory[] = [];
      
      if (eventId) {
        // Buscar detalhes completos
        event = await this.getEventByIdUseCase.execute(eventId);
        categories = await this.ticketCategoryRepository.findByEventId(eventId);
      } else {
        // Usar dados básicos disponíveis
        event = eventData as Event;
        if (eventData.ticketCategories) {
          categories = Array.isArray(eventData.ticketCategories) ? eventData.ticketCategories : [];
        }
      }

      const eventMessage = this.formatEventWithEmojis(event, categories);
      
      const media = event.image ? [{
        type: 'image' as const,
        url: event.image,
        caption: this.formatEventCaption(event),
      }] : [];

      // Formatar mensagem detalhada de ingressos com link de compra
      const ticketsMessage = this.formatTicketsMessage(event, categories);

      return {
        answer: eventMessage.text,
        data: {
          type: 'event_detail',
          items: [{ ...event, ticketCategories: categories }],
          rawData: event,
          ticketsMessage, // Adicionar mensagem de ingressos
        },
        media,
      };
    } catch (error) {
      this.logger.error('Erro ao formatar detalhes do evento', {
        error: error instanceof Error ? error.message : String(error),
        eventData,
      });
      
      // Fallback: usar dados básicos
      const fallbackText = `🎵 *Detalhes do Evento*\n\n*${eventData.title || 'Sem título'}*\n\n`;
      return {
        answer: fallbackText,
        data: {
          type: 'event_detail',
          items: [eventData],
          rawData: eventData,
        },
      };
    }
  }

  /**
   * Formata mensagem detalhada de ingressos com link de compra
   */
  private formatTicketsMessage(event: Event, categories: TicketCategory[]): string {
    // Garantir que frontendUrl termina com barra
    const baseUrl = this.frontendUrl.endsWith('/') ? this.frontendUrl : `${this.frontendUrl}/`;
    const eventLink = `${baseUrl}event/${event.id}`;
    
    let text = '🎫 *Ingressos Disponíveis*\n\n';
    
    if (!categories || categories.length === 0) {
      text += '❌ Não há ingressos disponíveis para este evento.\n\n';
    } else {
      // Filtrar apenas categorias ativas
      const activeCategories = categories.filter(cat => cat.isActive);
      
      if (activeCategories.length === 0) {
        text += '❌ Não há ingressos disponíveis no momento.\n\n';
      } else {
        activeCategories.forEach((category, index) => {
          const price = typeof category.price === 'string' 
            ? parseFloat(category.price) 
            : Number(category.price);
          
          const maxQuantity = typeof category.maxQuantity === 'string'
            ? parseInt(category.maxQuantity, 10)
            : Number(category.maxQuantity);
          
          const soldQuantity = typeof category.soldQuantity === 'string'
            ? parseInt(category.soldQuantity, 10)
            : Number(category.soldQuantity);
          
          const availableQuantity = maxQuantity - soldQuantity;
          
          text += `${index + 1}. *${category.name}*\n`;
          text += `   💰 R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
          
          if (category.description) {
            text += `   📝 ${category.description}\n`;
          }
          
          if (category.benefits && category.benefits.length > 0) {
            text += `   ✨ Benefícios: ${category.benefits.join(', ')}\n`;
          }
          
          if (availableQuantity > 0) {
            text += `   📊 Disponível: ${availableQuantity} de ${maxQuantity}\n`;
          } else {
            text += `   ⚠️ Esgotado\n`;
          }
          
          text += '\n';
        });
      }
    }
    
    // Adicionar texto de compra com link
    text += '💳 *Para comprar seus ingressos, acesse:*\n';
    text += `🔗 ${eventLink}\n\n`;
    text += '✨ Garanta já seu lugar neste evento incrível!';
    
    return text;
  }

  /**
   * Formata evento com emojis conforme especificação
   */
  private formatEventWithEmojis(event: Event, categories: TicketCategory[]): { text: string; imageUrl?: string } {
    // Garantir que frontendUrl termina com barra
    const baseUrl = this.frontendUrl.endsWith('/') ? this.frontendUrl : `${this.frontendUrl}/`;
    const eventLink = `${baseUrl}event/${event.id}`;
    
    // Formatar data no formato: DD/MM/YYYY (dia da semana) às HHhMM
    const eventDate = new Date(event.date);
    const day = String(eventDate.getDate()).padStart(2, '0');
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const year = eventDate.getFullYear();
    const weekday = eventDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const hours = String(eventDate.getHours()).padStart(2, '0');
    const minutes = String(eventDate.getMinutes()).padStart(2, '0');
    const dateStr = `${day}/${month}/${year} (${weekday}) às ${hours}h${minutes}`;
    
    // Formatar endereço completo: location, address, city - state
    const fullAddress = `${event.location}, ${event.address}, ${event.city} - ${event.state}`;
    
    // Formatar ingressos (omitir se não houver)
    let ticketsText = '';
    if (categories && categories.length > 0) {
      const ticketNames = categories
        .filter(cat => cat.isActive)
        .map(cat => cat.name)
        .join(', ');
      if (ticketNames) {
        ticketsText = `🪑 Ingressos: ${ticketNames}\n`;
      }
    }
    
    // Construir mensagem formatada conforme especificação
    let text = '';
    
    // Adicionar ID e informações básicas (conforme exemplo)
    text += `🎉 ID: ${event.id}\n\n`;
    
    // Formatar com emojis conforme especificação
    text += `🎉 Evento: ${event.title}\n`;
    text += `🎵 Categoria: ${event.category}\n`;
    text += `📍 Local: ${event.location}\n`;
    text += `🏙️ Cidade: ${event.city}\n`;
    text += `📌 Endereço: ${fullAddress}\n`;
    text += `🗓️ Data: ${dateStr}\n`;
    
    // Duração e classificação - usar metadata se disponível
    if (event.metadata?.duration) {
      const duration = typeof event.metadata.duration === 'number' 
        ? `${event.metadata.duration} horas`
        : event.metadata.duration;
      text += `⏳ Duração: ${duration}\n`;
    }
    
    if (event.metadata?.classification) {
      const classification = typeof event.metadata.classification === 'number'
        ? `${event.metadata.classification} anos`
        : event.metadata.classification;
      text += `🔞 Classificação: ${classification}\n`;
    }
    
    // Ingressos (omitir se vazio)
    if (ticketsText) {
      text += ticketsText;
    }
    
    // Link do evento conforme especificação
    text += `🔗 ${eventLink}`;
    
    return {
      text,
      imageUrl: event.image || undefined,
    };
  }

  private async formatArtistList(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    let artists: any[] = [];
    
    this.logger.debug('Formatando lista de artistas', {
      rawDataType: rawData ? typeof rawData : 'undefined',
      rawDataIsArray: Array.isArray(rawData),
      rawDataKeys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : [],
    });
    
    // Tentar extrair artistas dos dados
    if (rawData && Array.isArray(rawData)) {
      artists = rawData;
    } else if (rawData?.artists) {
      artists = Array.isArray(rawData.artists) ? rawData.artists : [rawData.artists];
    } else if (rawData?.data) {
      artists = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
    } else if (rawData && typeof rawData === 'object') {
      // Tentar encontrar arrays dentro do objeto
      for (const key of Object.keys(rawData)) {
        if (Array.isArray(rawData[key])) {
          artists = rawData[key];
          break;
        }
      }
    }

    this.logger.debug('Artistas extraídos', {
      artistsCount: artists.length,
      artistIds: artists.slice(0, 5).map((a: any) => a?.id || a?.artistId || 'no-id'),
    });

    const page = 1;
    const pageSize = 3; // Limitar a 3 artistas por página
    const { items: paginatedArtists, pagination } = this.paginationService.paginateItems(artists, page, pageSize);

    if (paginatedArtists.length === 0) {
      this.logger.warn('Nenhum artista encontrado em rawData', { rawData });
      return {
        answer: '❌ Não encontrei artistas cadastrados no momento.',
        data: {
          type: 'artist_list',
          items: [],
          rawData: artists,
        },
      };
    }

    // Enriquecer cada artista com eventos e dados completos
    const enrichedArtists: Array<{ artist: Artist; events: Event[] }> = [];
    const media: FormattedResponse['media'] = [];

    for (const artistData of paginatedArtists) {
      try {
        const artistId = artistData.id || artistData.artistId;
        if (!artistId) {
          this.logger.warn('Artista sem ID, pulando enriquecimento', { artistData });
          continue;
        }

        const artist = await this.getArtistByIdUseCase.execute(artistId, true);
        enrichedArtists.push({ artist, events: artist.events || [] });

        if (artist.image) {
          const artistText = this.formatArtistWithDetails(artist);
          media.push({
            type: 'image',
            url: artist.image,
            caption: artistText,
          });
        }
      } catch (error) {
        this.logger.error('Erro ao enriquecer artista com detalhes', {
          artistId: artistData.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const artistTexts = enrichedArtists.map(({ artist }) => this.formatArtistWithDetails(artist));

    // Criar mensagem de paginação se houver mais artistas
    let finalText = '';
    if (pagination.hasMore) {
      const paginationMessage = this.paginationService.formatPaginationMessage(
        pagination.current,
        pagination.total,
        pageSize,
        artists.length
      );
      finalText = `\n📄 ${paginationMessage}\n\n💡 Para ver mais artistas, digite "próximos artistas" ou "mais artistas".`;
    }

    return {
      answer: '', // Não há texto inicial para artistas
      data: {
        type: 'artist_list',
        items: enrichedArtists.map(({ artist, events }) => ({
          ...artist,
          events,
        })),
        pagination,
        rawData: artists,
        artistTexts, // Textos formatados de cada artista (para envio sequencial)
        finalText, // Texto final com informações de paginação
      },
      media,
    };
  }

  private formatArtistDetail(rawResponse: string, rawData: any, toolsUsed: any[]): FormattedResponse {
    const artist = rawData && !Array.isArray(rawData) ? rawData : (rawData?.[0] || rawData?.data?.[0]);
    
    if (!artist) {
      return this.formatGeneric(rawResponse, toolsUsed);
    }

    let text = '🎤 *Detalhes do Artista*\n\n';
    text += `*${artist.artisticName || 'Sem nome'}*\n`;
    if (artist.realName) text += `Nome real: ${artist.realName}\n`;
    text += '\n';
    
    if (artist.biography) {
      const bio = artist.biography.length > 500 
        ? artist.biography.substring(0, 500) + '...' 
        : artist.biography;
      text += `${bio}\n\n`;
    }
    
    if (artist.genre) text += `🎵 *Gênero:* ${artist.genre}\n`;
    if (artist.birthDate) {
      const birthDate = new Date(artist.birthDate).toLocaleDateString('pt-BR');
      text += `📅 *Data de nascimento:* ${birthDate}\n`;
    }
    if (artist.nationality) text += `🌎 *Nacionalidade:* ${artist.nationality}\n`;

    // Preparar mídia (imagem do artista)
    const media = artist.profileImage || artist.image ? [{
      type: 'image' as const,
      url: artist.profileImage || artist.image,
      caption: this.formatArtistCaption(artist),
    }] : [];

    return {
      answer: text,
      data: {
        type: 'artist_detail',
        items: [artist],
        rawData: artist,
      },
      media,
    };
  }

  /**
   * Formata mensagem de ingressos do usuário para um evento
   */
  public async formatUserTicketsMessage(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    // Extrair dados do evento e ingressos
    let event: any = null;
    let tickets: any[] = [];
    
    // rawData pode vir como objeto com { event, tickets } ou como array com tickets
    if (rawData && typeof rawData === 'object') {
      if (rawData.event) {
        event = rawData.event;
      }
      if (rawData.tickets) {
        tickets = Array.isArray(rawData.tickets) ? rawData.tickets : [rawData.tickets];
      } else if (Array.isArray(rawData)) {
        tickets = rawData;
      } else if (rawData.data) {
        if (rawData.data.event) {
          event = rawData.data.event;
        }
        if (rawData.data.tickets) {
          tickets = Array.isArray(rawData.data.tickets) ? rawData.data.tickets : [rawData.data.tickets];
        }
      }
    }

    // Se não há ingressos, retornar mensagem informativa
    if (!tickets || tickets.length === 0) {
      const eventInfo = event ? ` para o evento *${event.title || 'desconhecido'}*` : '';
      return {
        answer: `❌ Você não possui ingressos${eventInfo}.\n\n💡 Se desejar comprar ingressos, acesse o link do evento ou peça mais informações.`,
        data: {
          type: 'user_tickets',
          tickets: [],
          event: event || null,
          rawData: rawData,
        },
        media: [],
      };
    }

    // Se não temos o evento, tentar buscar do primeiro ingresso
    if (!event && tickets.length > 0) {
      event = {
        id: tickets[0].eventId,
        title: tickets[0].eventTitle || 'Evento',
        date: tickets[0].eventDate ? new Date(tickets[0].eventDate) : null,
        location: tickets[0].eventLocation || 'Local não informado',
        address: tickets[0].eventLocation || '',
        city: '',
        state: '',
      };
    }

    // Formatar texto com informações do evento e ingressos
    let text = '🎫 *Seus Ingressos*\n\n';
    
    if (event) {
      text += `🎉 *Evento:* ${event.title || 'Evento'}\n`;
      
      if (event.date) {
        const eventDate = new Date(event.date);
        const day = String(eventDate.getDate()).padStart(2, '0');
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const year = eventDate.getFullYear();
        const weekday = eventDate.toLocaleDateString('pt-BR', { weekday: 'long' });
        const hours = String(eventDate.getHours()).padStart(2, '0');
        const minutes = String(eventDate.getMinutes()).padStart(2, '0');
        const dateStr = `${day}/${month}/${year} (${weekday}) às ${hours}h${minutes}`;
        text += `🗓️ *Data:* ${dateStr}\n`;
      }
      
      if (event.location) {
        const fullAddress = event.address && event.city && event.state
          ? `${event.location}, ${event.address}, ${event.city} - ${event.state}`
          : event.location;
        text += `📍 *Local:* ${fullAddress}\n`;
      }
      
      text += '\n';
    }

    // Adicionar informações de cada ingresso
    text += `📋 *Ingressos (${tickets.length}):*\n\n`;
    
    tickets.forEach((ticket: any, index: number) => {
      text += `${index + 1}. *${ticket.categoryName || 'Ingresso'}*\n`;
      
      if (ticket.holderFirstName || ticket.holderLastName) {
        const holderName = `${ticket.holderFirstName || ''} ${ticket.holderLastName || ''}`.trim();
        if (holderName) {
          text += `   👤 Portador: ${holderName}\n`;
        }
      }
      
      if (ticket.documentType && ticket.documentNumber) {
        text += `   📄 ${ticket.documentType}: ${ticket.documentNumber}\n`;
      }
      
      const price = typeof ticket.price === 'number' ? ticket.price : parseFloat(ticket.price || '0');
      text += `   💰 Valor: R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      
      // Status do ingresso
      const statusEmoji = ticket.status === 'ACTIVE' ? '✅' : ticket.status === 'USED' ? '🔴' : ticket.status === 'TRANSFERRED' ? '🔄' : '⚠️';
      const statusText = ticket.status === 'ACTIVE' ? 'Ativo' : ticket.status === 'USED' ? 'Usado' : ticket.status === 'TRANSFERRED' ? 'Transferido' : ticket.status || 'Desconhecido';
      text += `   ${statusEmoji} Status: ${statusText}\n`;
      
      if (ticket.purchasedAt || ticket.purchaseDate) {
        const purchaseDate = ticket.purchasedAt || ticket.purchaseDate;
        const purchaseDateStr = new Date(purchaseDate).toLocaleDateString('pt-BR');
        text += `   📅 Comprado em: ${purchaseDateStr}\n`;
      }
      
      text += '\n';
    });

    // Preparar QR codes para envio
    const media: FormattedResponse['media'] = [];
    
    this.logger.debug('[USER_TICKETS_FORMAT] Preparando QR codes', {
      ticketsCount: tickets.length,
      ticketsHaveQRCode: tickets.map((t: any) => !!t.qrCode),
      ticketsHaveQRCodeData: tickets.map((t: any) => !!t.qrCodeData),
      firstTicketKeys: tickets.length > 0 ? Object.keys(tickets[0] || {}) : [],
    });
    
    tickets.forEach((ticket: any, index: number) => {
      // Sempre criar entrada de media para cada ticket usando qrCodeData
      // O webhook gerará o QR code dinamicamente se necessário
      if (ticket.qrCodeData) {
        // Usar placeholder para indicar que precisa gerar QR code
        media.push({
          type: 'image',
          url: `ticket:${ticket.qrCodeData}`, // Marca especial para indicar que precisa gerar QR code
          caption: `QR Code - ${ticket.categoryName || 'Ingresso'}`, // Será sobrescrito no webhook
        });
        
        this.logger.debug('[USER_TICKETS_FORMAT] QR code adicionado para ticket', {
          ticketIndex: index,
          ticketId: ticket.id,
          qrCodeData: ticket.qrCodeData.substring(0, 50),
          hasQRCode: !!ticket.qrCode,
        });
      } else if (ticket.qrCode) {
        // Fallback: se tiver QR code base64, usar diretamente
        const qrCodeData = ticket.qrCode.startsWith('data:image') 
          ? ticket.qrCode 
          : `data:image/png;base64,${ticket.qrCode}`;
        
        media.push({
          type: 'image',
          url: qrCodeData,
          caption: `QR Code - ${ticket.categoryName || 'Ingresso'}`,
        });
      } else {
        // Se não tem nem qrCodeData nem qrCode, logar warning mas não adicionar media
        this.logger.warn('[USER_TICKETS_FORMAT] Ticket sem qrCodeData ou qrCode', {
          ticketIndex: index,
          ticketId: ticket.id,
          categoryName: ticket.categoryName,
        });
      }
    });

    return {
      answer: text,
      data: {
        type: 'user_tickets',
        tickets: tickets,
        event: event || null,
        rawData: rawData,
      },
      media: media,
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

    let text = '🎫 *Ingressos Disponíveis*\n\n';
    
    if (categories.length === 0) {
      text = '❌ Não há ingressos disponíveis para este evento.';
    } else {
      categories.forEach((category: any, index: number) => {
        const name = category.name || 'Ingresso';
        const price = category.price ? `R$ ${category.price.toFixed(2)}` : 'Preço não informado';
        const quantity = category.maxQuantity ? `(${category.maxQuantity} disponíveis)` : '';
        
        text += `${index + 1}. *${name}*\n`;
        text += `💰 ${price} ${quantity}\n`;
        if (category.description) text += `📝 ${category.description}\n`;
        text += '\n';
      });
    }

    return {
      answer: text,
      data: {
        type: 'ticket_prices',
        items: categories,
        rawData: categories,
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
    return this.formatArtistWithDetails(artist);
  }

  /**
   * Formata artista com todas as informações detalhadas
   */
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
}

