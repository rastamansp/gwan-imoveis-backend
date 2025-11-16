/**
 * Tipos de resposta estruturada para formatação por canal
 */
export type ResponseType = 
  | 'property_list'
  | 'property_detail'
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
  };
  media?: {
    type: 'image' | 'video' | 'document';
    url: string;
    caption?: string;
  }[];
}

export interface PropertyListResponse {
  type: 'property_list';
  properties: any[];
  pagination: PaginationInfo;
}

export interface PropertyDetailResponse {
  type: 'property_detail';
  property: any;
}

export interface SuggestionsResponse {
  suggestions: string[];
}

