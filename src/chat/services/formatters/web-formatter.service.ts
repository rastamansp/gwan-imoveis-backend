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
        case 'property_list':
          return this.formatPropertyList(rawResponse, rawData, toolsUsed);
        
        case 'property_detail':
          return this.formatPropertyDetail(rawResponse, rawData, toolsUsed);
        
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
    
    if (lastTool.includes('list_properties')) {
      return 'property_list';
    }
    
    if (lastTool.includes('get_property_by_id') || lastTool.includes('property_detail')) {
      return 'property_detail';
    }
    
    return 'generic';
  }

  private formatPropertyList(rawResponse: string, rawData: any, toolsUsed: any[]): FormattedResponse {
    let properties: any[] = [];
    
    if (rawData && Array.isArray(rawData)) {
      properties = rawData;
    } else if (rawData?.properties) {
      properties = Array.isArray(rawData.properties) ? rawData.properties : [rawData.properties];
    } else if (rawData?.data) {
      properties = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
    }

    const page = 1;
    const pageSize = 10;
    const { items: paginatedProperties, pagination } = this.paginationService.paginateItems(properties, page, pageSize);

    // Gerar Markdown formatado para visualização no cliente web
    const markdownAnswer = this.generatePropertyListMarkdown(paginatedProperties, properties.length);

    // Incluir apenas dados essenciais para listagem (otimizado para reduzir payload)
    const optimizedProperties = paginatedProperties.map((p: any) => ({
      // Dados essenciais para listagem
      id: p.id,
      title: p.title,
      type: p.type,
      purpose: p.purpose || null,
      price: p.price ? Number(p.price) : null,
      city: p.city,
      neighborhood: p.neighborhood,
      area: p.area ? Number(p.area) : null,
      bedrooms: p.bedrooms || null,
      bathrooms: p.bathrooms || null,
      garageSpaces: p.garageSpaces || null,
      // Comodidades resumidas (apenas as que estão ativas)
      amenities: (() => {
        const active: string[] = [];
        if (p.hasPool) active.push('hasPool');
        if (p.hasJacuzzi) active.push('hasJacuzzi');
        if (p.oceanFront) active.push('oceanFront');
        if (p.hasGarden) active.push('hasGarden');
        if (p.hasGourmetArea) active.push('hasGourmetArea');
        if (p.furnished) active.push('furnished');
        return active;
      })(),
      coverImageUrl: p.coverImageUrl || null,
      url: `${this.frontendUrl}imoveis/${p.id}`,
    }));

    const suggestions = this.suggestionsService.generateContextualSuggestions('property_list', { properties: paginatedProperties });

    return {
      answer: markdownAnswer, // Resposta em Markdown
      data: {
        type: 'property_list',
        items: optimizedProperties, // Dados otimizados para listagem
        pagination: {
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          hasMore: pagination.hasMore,
        },
        suggestions,
        // rawData removido para reduzir payload - use get_property_by_id para detalhes completos
      },
      media: optimizedProperties
        .filter((p: any) => p.coverImageUrl)
        .map((p: any) => ({
          type: 'image' as const,
          url: p.coverImageUrl,
          caption: p.title,
        })),
    };
  }

  /**
   * Gera Markdown formatado para lista de propriedades
   */
  private generatePropertyListMarkdown(properties: any[], totalCount: number): string {
    if (properties.length === 0) {
      return 'Não há imóveis cadastrados no momento.';
    }

    let markdown = `## 🏠 Imóveis Encontrados (${totalCount})\n\n`;

    properties.forEach((p: any, index: number) => {
      const price = p.price ? `**R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**` : 'Preço sob consulta';
      const type = p.type || 'Imóvel';
      const purpose = p.purpose ? (p.purpose === 'RENT' ? 'Aluguel' : p.purpose === 'SALE' ? 'Venda' : 'Investimento') : '';
      const city = p.city || '';
      const neighborhood = p.neighborhood || '';
      const area = p.area ? `${Number(p.area).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²` : '';
      
      markdown += `### ${index + 1}. ${p.title || 'Sem título'}\n\n`;
      markdown += `- **Tipo:** ${type}\n`;
      if (purpose) markdown += `- **Finalidade:** ${purpose}\n`;
      if (city) markdown += `- **Cidade:** ${city}\n`;
      if (neighborhood) markdown += `- **Bairro:** ${neighborhood}\n`;
      markdown += `- **Preço:** ${price}\n`;
      if (area) markdown += `- **Área:** ${area}\n`;
      if (p.bedrooms) markdown += `- **Quartos:** ${p.bedrooms}\n`;
      if (p.bathrooms) markdown += `- **Banheiros:** ${p.bathrooms}\n`;
      if (p.garageSpaces) markdown += `- **Vagas:** ${p.garageSpaces}\n`;
      
      // Amenities
      const amenities: string[] = [];
      if (p.hasPool) amenities.push('🏊 Piscina');
      if (p.hasJacuzzi) amenities.push('💆 Hidromassagem');
      if (p.oceanFront) amenities.push('🌊 Frente Mar');
      if (p.hasGarden) amenities.push('🌳 Jardim');
      if (p.hasGourmetArea) amenities.push('🍖 Área Gourmet');
      if (p.furnished) amenities.push('🛋️ Mobiliado');
      
      if (amenities.length > 0) {
        markdown += `- **Comodidades:** ${amenities.join(', ')}\n`;
      }
      
      // Imagem de capa
      if (p.coverImageUrl) {
        markdown += `\n![${p.title || 'Imóvel'}](${p.coverImageUrl})\n`;
      }
      
      // Link para detalhes
      markdown += `\n[Ver detalhes](${this.frontendUrl}imoveis/${p.id})\n\n`;
      markdown += '---\n\n';
    });

    if (totalCount > properties.length) {
      markdown += `\n*Mostrando ${properties.length} de ${totalCount} imóveis*\n`;
    }

    return markdown;
  }

  private formatPropertyDetail(rawResponse: string, rawData: any, toolsUsed: any[]): FormattedResponse {
    const property = rawData && !Array.isArray(rawData) ? rawData : (rawData?.[0] || rawData?.data?.[0] || rawData?.property);
    
    if (!property) {
      return this.formatGeneric(rawResponse, toolsUsed);
    }

    // Gerar Markdown formatado para visualização no cliente web
    const markdownAnswer = this.generatePropertyDetailMarkdown(property);

    // Objeto completo do imóvel para personalização pelo canal
    const completeProperty = {
      // Dados completos do imóvel
      id: property.id,
      title: property.title,
      description: property.description || null,
      type: property.type,
      purpose: property.purpose || null,
      price: property.price ? Number(property.price) : null,
      city: property.city,
      neighborhood: property.neighborhood,
      area: property.area ? Number(property.area) : null,
      bedrooms: property.bedrooms || null,
      bathrooms: property.bathrooms || null,
      garageSpaces: property.garageSpaces || null,
      amenities: {
        hasPool: property.hasPool || false,
        hasJacuzzi: property.hasJacuzzi || false,
        oceanFront: property.oceanFront || false,
        hasGarden: property.hasGarden || false,
        hasGourmetArea: property.hasGourmetArea || false,
        furnished: property.furnished || false,
      },
      coverImageUrl: property.coverImageUrl || null,
      images: property.images || [],
      realtor: property.realtor ? {
        id: property.realtor.id,
        name: property.realtor.name,
        email: property.realtor.email,
        phone: property.realtor.phone || null,
      } : null,
      createdAt: property.createdAt || null,
      updatedAt: property.updatedAt || null,
      // Campos formatados para conveniência
      priceFormatted: property.price ? `R$ ${Number(property.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
      areaFormatted: property.area ? `${Number(property.area).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²` : null,
      url: `${this.frontendUrl}imoveis/${property.id}`,
    };

    const suggestions = this.suggestionsService.generateContextualSuggestions('property_detail', completeProperty);

    // Preparar mídia (imagem de capa + outras imagens)
    const media: Array<{ type: 'image'; url: string; caption?: string }> = [];
    if (completeProperty.coverImageUrl) {
      media.push({
        type: 'image',
        url: completeProperty.coverImageUrl,
        caption: completeProperty.title,
      });
    }
    if (Array.isArray(completeProperty.images) && completeProperty.images.length > 0) {
      completeProperty.images.forEach((img: any) => {
        if (img.url && img.url !== completeProperty.coverImageUrl) {
          media.push({
            type: 'image',
            url: img.url,
            caption: `${completeProperty.title} - Imagem ${media.length}`,
          });
        }
      });
    }

    return {
      answer: markdownAnswer, // Resposta em Markdown
      data: {
        type: 'property_detail',
        items: [completeProperty], // Objeto completo para personalização
        suggestions,
        rawData: property, // Dados brutos completos
      },
      media: media.length > 0 ? media : undefined,
    };
  }

  /**
   * Gera Markdown formatado para detalhes de uma propriedade
   */
  private generatePropertyDetailMarkdown(property: any): string {
    const price = property.price ? `**R$ ${Number(property.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**` : 'Preço sob consulta';
    const type = property.type || 'Imóvel';
    const area = property.area ? `${Number(property.area).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²` : '';
    
    let markdown = `# ${property.title || 'Imóvel'}\n\n`;
    
    // Imagem de capa
    if (property.coverImageUrl) {
      markdown += `![${property.title || 'Imóvel'}](${property.coverImageUrl})\n\n`;
    }
    
    markdown += `## 📋 Informações Básicas\n\n`;
    markdown += `- **Tipo:** ${type}\n`;
    markdown += `- **Preço:** ${price}\n`;
    if (area) markdown += `- **Área:** ${area}\n`;
    if (property.city) markdown += `- **Cidade:** ${property.city}\n`;
    if (property.neighborhood) markdown += `- **Bairro:** ${property.neighborhood}\n`;
    if (property.bedrooms) markdown += `- **Quartos:** ${property.bedrooms}\n`;
    if (property.bathrooms) markdown += `- **Banheiros:** ${property.bathrooms}\n`;
    if (property.garageSpaces) markdown += `- **Vagas de Garagem:** ${property.garageSpaces}\n`;
    
    // Comodidades
    const amenities: string[] = [];
    if (property.hasPool) amenities.push('🏊 Piscina');
    if (property.hasJacuzzi) amenities.push('💆 Hidromassagem');
    if (property.oceanFront) amenities.push('🌊 Frente Mar');
    if (property.hasGarden) amenities.push('🌳 Jardim');
    if (property.hasGourmetArea) amenities.push('🍖 Área Gourmet');
    if (property.furnished) amenities.push('🛋️ Mobiliado');
    
    if (amenities.length > 0) {
      markdown += `\n## 🎯 Comodidades\n\n`;
      markdown += amenities.join(' • ') + '\n\n';
    }
    
    // Descrição
    if (property.description) {
      markdown += `## 📝 Descrição\n\n`;
      markdown += `${property.description}\n\n`;
    }
    
    // Realtor
    if (property.realtor) {
      markdown += `## 👤 Realtor\n\n`;
      markdown += `- **Nome:** ${property.realtor.name || 'N/A'}\n`;
      if (property.realtor.email) markdown += `- **Email:** ${property.realtor.email}\n`;
      if (property.realtor.phone) markdown += `- **Telefone:** ${property.realtor.phone}\n`;
      markdown += '\n';
    }
    
    // Galeria de imagens
    if (Array.isArray(property.images) && property.images.length > 0) {
      markdown += `## 🖼️ Galeria de Imagens\n\n`;
      property.images.forEach((img: any, index: number) => {
        if (img.url) {
          markdown += `![Imagem ${index + 1}](${img.url})\n\n`;
        }
      });
    }
    
    // Link para visualização
    markdown += `\n[Ver no site](${this.frontendUrl}imoveis/${property.id})\n`;

    return markdown;
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

