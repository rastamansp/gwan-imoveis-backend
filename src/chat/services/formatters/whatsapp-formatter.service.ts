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
  private readonly defaultEventLimit = 5; // Limite padrão de eventos para listar
  private readonly frontendUrl: string;

  constructor(
    private readonly paginationService: PaginationService,
    private readonly suggestionsService: SuggestionsService,
    private readonly configService: ConfigService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://imoveis.gwan.cloud/';
  }

  /**
   * Formata resposta para WhatsApp
   */
  async format(rawResponse: string, toolsUsed: { name: string; arguments?: Record<string, unknown> }[], rawData?: any): Promise<FormattedResponse> {
    const responseType = this.detectResponseType(toolsUsed);
    
    try {
      switch (responseType) {
        case 'property_list':
          return await this.formatPropertyList(rawResponse, rawData, toolsUsed);
        
        case 'property_detail':
          return await this.formatPropertyDetail(rawResponse, rawData, toolsUsed);
        
        default:
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

    if (lastTool.includes('list_properties') || lastTool.includes('search_properties_semantic')) {
      return 'property_list';
    }

    if (lastTool.includes('get_property_by_id') || lastTool.includes('property_detail')) {
      return 'property_detail';
    }

    return 'generic';
  }

  private formatGeneric(rawResponse: string, toolsUsed: any[]): FormattedResponse {
    return {
      answer: rawResponse,
      data: {
        type: 'generic',
      },
    };
  }

  private async formatPropertyList(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    let properties: any[] = [];
    
    if (rawData && Array.isArray(rawData)) {
      properties = rawData;
    } else if (rawData?.properties) {
      properties = Array.isArray(rawData.properties) ? rawData.properties : [rawData.properties];
    } else if (rawData?.data) {
      properties = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
    }

    // Limitar quantidade de propriedades
    const limitedProperties = properties.slice(0, this.defaultEventLimit);
    
    if (limitedProperties.length === 0) {
      return {
        answer: '❌ Não encontrei imóveis cadastrados no momento.',
        data: {
          type: 'property_list',
          items: [],
        },
      };
    }

    // Formatar lista de propriedades
    let message = `🏠 *Encontrei ${properties.length} imóvel(is):*\n\n`;
    
    limitedProperties.forEach((p: any, index: number) => {
      const price = p.price ? `R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Preço sob consulta';
      const type = p.type || 'Imóvel';
      const purpose = p.purpose ? (p.purpose === 'RENT' ? 'Aluguel' : p.purpose === 'SALE' ? 'Venda' : 'Investimento') : '';
      const city = p.city || '';
      const neighborhood = p.neighborhood || '';
      const area = p.area ? `${p.area}m²` : '';
      const bedrooms = p.bedrooms ? `${p.bedrooms} quarto(s)` : '';
      const bathrooms = p.bathrooms ? `${p.bathrooms} banheiro(s)` : '';
      
      message += `${index + 1}. *${p.title || 'Sem título'}*\n`;
      message += `   ${type}${purpose ? ` - ${purpose}` : ''}${city ? ` - ${city}` : ''}${neighborhood ? `, ${neighborhood}` : ''}\n`;
      message += `   💰 ${price}\n`;
      if (area || bedrooms || bathrooms) {
        const details = [area, bedrooms, bathrooms].filter(Boolean).join(' • ');
        message += `   📐 ${details}\n`;
      }
      
      // Amenities
      const amenities: string[] = [];
      if (p.hasPool) amenities.push('🏊 Piscina');
      if (p.hasJacuzzi) amenities.push('💆 Hidromassagem');
      if (p.oceanFront) amenities.push('🌊 Frente Mar');
      if (p.hasGarden) amenities.push('🌳 Jardim');
      if (p.hasGourmetArea) amenities.push('🍖 Área Gourmet');
      if (p.furnished) amenities.push('🛋️ Mobiliado');
      
      if (amenities.length > 0) {
        message += `   ${amenities.join(' • ')}\n`;
      }
      
      message += `   🔗 ${this.frontendUrl}property/${p.id}\n\n`;
    });

    if (properties.length > this.defaultEventLimit) {
      message += `\n_... e mais ${properties.length - this.defaultEventLimit} imóvel(is)_`;
    }

    return {
      answer: message,
      data: {
        type: 'property_list',
        items: limitedProperties,
        rawData: properties,
      },
    };
  }

  private async formatPropertyDetail(rawResponse: string, rawData: any, toolsUsed: any[]): Promise<FormattedResponse> {
    const property = rawData && !Array.isArray(rawData) ? rawData : (rawData?.[0] || rawData?.data?.[0] || rawData?.property);
    
    if (!property) {
      return this.formatGeneric(rawResponse, toolsUsed);
    }

    // Formatar detalhes completos do imóvel
    let message = `🏠 *${property.title || 'Imóvel'}*\n\n`;
    
    const price = property.price ? `R$ ${Number(property.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Preço sob consulta';
    const type = property.type || 'Imóvel';
    const purpose = property.purpose ? (property.purpose === 'RENT' ? 'Aluguel' : property.purpose === 'SALE' ? 'Venda' : 'Investimento') : '';
    const city = property.city || '';
    const neighborhood = property.neighborhood || '';
    
    message += `💰 *Preço:* ${price}\n`;
    message += `📍 *Localização:* ${type}${purpose ? ` - ${purpose}` : ''}${city ? ` - ${city}` : ''}${neighborhood ? `, ${neighborhood}` : ''}\n\n`;
    
    // Características
    if (property.area || property.bedrooms || property.bathrooms || property.garageSpaces) {
      message += `📐 *Características:*\n`;
      if (property.area) message += `   • Área: ${property.area}m²\n`;
      if (property.bedrooms) message += `   • ${property.bedrooms} quarto(s)\n`;
      if (property.bathrooms) message += `   • ${property.bathrooms} banheiro(s)\n`;
      if (property.garageSpaces) message += `   • ${property.garageSpaces} vaga(s) de garagem\n`;
      message += `\n`;
    }
    
    // Amenities
    const amenities: string[] = [];
    if (property.hasPool) amenities.push('🏊 Piscina');
    if (property.hasJacuzzi) amenities.push('💆 Hidromassagem');
    if (property.oceanFront) amenities.push('🌊 Frente Mar');
    if (property.hasGarden) amenities.push('🌳 Jardim');
    if (property.hasGourmetArea) amenities.push('🍖 Área Gourmet');
    if (property.furnished) amenities.push('🛋️ Mobiliado');
    
    if (amenities.length > 0) {
      message += `✨ *Comodidades:*\n${amenities.join(' • ')}\n\n`;
    }
    
    // Descrição
    if (property.description) {
      const description = property.description.length > 200 
        ? property.description.substring(0, 200) + '...' 
        : property.description;
      message += `📝 *Descrição:*\n${description}\n\n`;
    }
    
    // Realtor
    if (property.realtor) {
      message += `👤 *Corretor:* ${property.realtor.name || property.realtor.email}\n\n`;
    }
    
    // Link
    message += `🔗 ${this.frontendUrl}property/${property.id}`;

    return {
      answer: message,
      data: {
        type: 'property_detail',
        items: [property],
        rawData: property,
      },
      media: property.coverImageUrl ? [{
        type: 'image' as const,
        url: property.coverImageUrl,
        caption: property.title || '',
      }] : undefined,
    };
  }
}

