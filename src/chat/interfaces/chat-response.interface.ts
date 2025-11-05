/**
 * Tipos de resposta estruturada para formatação por canal
 */
export type ResponseType = 
  | 'event_list' 
  | 'event_detail' 
  | 'artist_list' 
  | 'artist_detail' 
  | 'ticket_prices'
  | 'user_tickets'
  | 'generic';

export interface PaginationInfo {
  current: number;
  total: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FormattedResponse {
  answer: string; // Resposta textual formatada
  data?: {
    type: ResponseType;
    items?: any[];
    pagination?: PaginationInfo;
    suggestions?: string[];
          rawData?: any; // Dados brutos para formatação adicional
          eventTexts?: string[]; // Textos formatados de cada evento (para envio sequencial)
          finalText?: string; // Texto final (para listas de eventos)
          artistTexts?: string[]; // Textos formatados de cada artista (para envio sequencial)
          ticketsMessage?: string; // Mensagem detalhada de ingressos com link de compra (para eventos individuais)
          tickets?: any[]; // Lista de ingressos do usuário (para user_tickets)
          event?: any; // Dados do evento (para user_tickets)
  };
  media?: {
    type: 'image' | 'video' | 'document';
    url: string;
    caption?: string;
  }[];
}

export interface EventListResponse {
  type: 'event_list';
  events: any[];
  pagination: PaginationInfo;
}

export interface EventDetailResponse {
  type: 'event_detail';
  event: any;
}

export interface ArtistListResponse {
  type: 'artist_list';
  artists: any[];
  pagination: PaginationInfo;
}

export interface ArtistDetailResponse {
  type: 'artist_detail';
  artist: any;
}

export interface TicketPricesResponse {
  type: 'ticket_prices';
  eventId: string;
  categories: any[];
}

export interface SuggestionsResponse {
  suggestions: string[];
}

