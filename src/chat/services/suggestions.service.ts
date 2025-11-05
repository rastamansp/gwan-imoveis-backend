import { Injectable } from '@nestjs/common';
import { ResponseType } from '../interfaces/chat-response.interface';

@Injectable()
export class SuggestionsService {
  /**
   * Gera sugestões de respostas baseadas no tipo de resposta
   */
  generateSuggestions(responseType: ResponseType, context?: any): string[] {
    switch (responseType) {
      case 'event_list':
        return [
          'Ver detalhes de um evento',
          'Ver preços de ingressos',
          'Filtrar por categoria',
          'Buscar eventos em outra cidade',
        ];

      case 'event_detail':
        const suggestions: string[] = ['Ver ingressos disponíveis'];
        if (context?.hasArtists) {
          suggestions.push('Ver artistas do evento');
        }
        suggestions.push('Buscar eventos similares');
        return suggestions;

      case 'artist_list':
        return [
          'Ver detalhes de um artista',
          'Ver eventos do artista',
          'Buscar mais artistas',
        ];

      case 'artist_detail':
        return [
          'Ver eventos do artista',
          'Ver redes sociais',
          'Buscar artistas similares',
        ];

      case 'ticket_prices':
        return [
          'Ver detalhes do evento',
          'Ver categorias disponíveis',
          'Compartilhar evento',
        ];

      default:
        return [
          'Como posso ajudar?',
          'Ver eventos disponíveis',
          'Listar artistas',
        ];
    }
  }

  /**
   * Gera sugestões contextuais baseadas em dados específicos
   */
  generateContextualSuggestions(responseType: ResponseType, data: any): string[] {
    const baseSuggestions = this.generateSuggestions(responseType, data);
    
    // Adicionar sugestões específicas baseadas nos dados
    if (responseType === 'event_list' && data?.events?.length > 0) {
      // Se houver eventos, adicionar sugestão para ver detalhes do primeiro
      if (data.events[0]?.id) {
        baseSuggestions.unshift(`Ver detalhes do evento "${data.events[0].title || 'primeiro'}"`);
      }
    }
    
    if (responseType === 'artist_list' && data?.artists?.length > 0) {
      // Se houver artistas, adicionar sugestão para ver detalhes do primeiro
      if (data.artists[0]?.id) {
        baseSuggestions.unshift(`Ver detalhes do artista "${data.artists[0].artisticName || 'primeiro'}"`);
      }
    }
    
    return baseSuggestions.slice(0, 4); // Limitar a 4 sugestões
  }
}

