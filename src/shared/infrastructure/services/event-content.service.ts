import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { TicketCategory } from '../../domain/entities/ticket-category.entity';

export interface EventMetadata {
  event: {
    id: string;
    title: string;
    description: string;
    code: string | null;
    date: string;
    location: string;
    address: string;
    city: string;
    state: string;
    category: string;
    organizerName: string;
    status: string;
    maxCapacity: number;
    soldTickets: number;
    availableTickets: number;
  };
  ticketCategories: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    maxQuantity: number;
    benefits: string[];
  }>;
  textContent: string;
}

@Injectable()
export class EventContentService {
  /**
   * Constrói os metadados completos do evento em formato JSON
   */
  buildEventMetadata(event: Event, categories: TicketCategory[]): EventMetadata {
    const availableTickets = Math.max(0, event.maxCapacity - event.soldTickets);

    const metadata: EventMetadata = {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        code: event.code || null,
        date: event.date.toISOString(),
        location: event.location,
        address: event.address,
        city: event.city,
        state: event.state,
        category: event.category,
        organizerName: event.organizerName,
        status: event.status,
        maxCapacity: event.maxCapacity,
        soldTickets: event.soldTickets,
        availableTickets,
      },
      ticketCategories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        price: typeof cat.price === 'string' ? parseFloat(cat.price) : Number(cat.price),
        maxQuantity: typeof cat.maxQuantity === 'string' ? parseInt(cat.maxQuantity, 10) : Number(cat.maxQuantity),
        benefits: cat.benefits || [],
      })),
      textContent: this.buildTextContent(event, categories),
    };

    return metadata;
  }

  /**
   * Constrói o texto consolidado para geração de embedding
   * Formato estruturado para melhor compreensão semântica
   */
  buildTextContent(event: Event, categories: TicketCategory[]): string {
    const parts: string[] = [];

    // Informações principais do evento
    parts.push(`Evento: ${event.title}`);
    parts.push(`Descrição: ${event.description}`);
    
    if (event.code) {
      parts.push(`Código: ${event.code}`);
    }

    // Localização e data
    parts.push(`Data: ${event.date.toLocaleString('pt-BR')}`);
    parts.push(`Local: ${event.location}, ${event.address}, ${event.city} - ${event.state}`);
    parts.push(`Categoria: ${event.category}`);

    // Organizador
    parts.push(`Organizador: ${event.organizerName}`);

    // Capacidade e ingressos
    parts.push(`Capacidade máxima: ${event.maxCapacity} pessoas`);
    parts.push(`Ingressos vendidos: ${event.soldTickets}`);
    const available = Math.max(0, event.maxCapacity - event.soldTickets);
    parts.push(`Ingressos disponíveis: ${available}`);

    // Status
    parts.push(`Status: ${event.status}`);

    // Categorias de ingressos
    if (categories.length > 0) {
      parts.push('\nCategorias de Ingressos:');
      categories.forEach((cat, index) => {
        // Garantir que price seja um número
        const price = typeof cat.price === 'string' ? parseFloat(cat.price) : Number(cat.price);
        const maxQuantity = typeof cat.maxQuantity === 'string' ? parseInt(cat.maxQuantity, 10) : Number(cat.maxQuantity);
        
        parts.push(`${index + 1}. ${cat.name} - R$ ${price.toFixed(2)}`);
        if (cat.description) {
          parts.push(`   Descrição: ${cat.description}`);
        }
        if (cat.benefits && cat.benefits.length > 0) {
          parts.push(`   Benefícios: ${cat.benefits.join(', ')}`);
        }
        parts.push(`   Quantidade máxima: ${maxQuantity}`);
      });
    }

    return parts.join('\n');
  }
}

