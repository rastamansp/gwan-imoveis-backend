import { Injectable } from '@nestjs/common';
import { ResponseType } from '../interfaces/chat-response.interface';

@Injectable()
export class SuggestionsService {
  /**
   * Gera sugestões de respostas baseadas no tipo de resposta
   */
  generateSuggestions(responseType: ResponseType, context?: any): string[] {
    switch (responseType) {
      case 'property_list':
        return [
          'Ver detalhes de um imóvel',
          'Filtrar por tipo',
          'Filtrar por preço',
          'Buscar imóveis em outra cidade',
        ];

      case 'property_detail':
        return [
          'Ver mais imagens',
          'Ver outros imóveis do corretor',
          'Buscar imóveis similares',
          'Ver imóveis na mesma cidade',
        ];

      default:
        return [
          'Como posso ajudar?',
          'Listar imóveis disponíveis',
          'Buscar imóveis por cidade',
          'Ver imóveis por tipo',
        ];
    }
  }

  /**
   * Gera sugestões contextuais baseadas em dados específicos
   */
  generateContextualSuggestions(responseType: ResponseType, data: any): string[] {
    const baseSuggestions = this.generateSuggestions(responseType, data);
    
    // Adicionar sugestões específicas baseadas nos dados
    if (responseType === 'property_list' && data?.properties?.length > 0) {
      // Se houver imóveis, adicionar sugestão para ver detalhes do primeiro
      if (data.properties[0]?.id) {
        baseSuggestions.unshift(`Ver detalhes do imóvel "${data.properties[0].title || 'primeiro'}"`);
      }
    } else if (responseType === 'property_list' && Array.isArray(data) && data.length > 0) {
      // Se data for um array direto de propriedades
      if (data[0]?.id) {
        baseSuggestions.unshift(`Ver detalhes do imóvel "${data[0].title || 'primeiro'}"`);
      }
    }
    
    return baseSuggestions.slice(0, 4); // Limitar a 4 sugestões
  }
}

