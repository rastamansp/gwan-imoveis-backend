import { Injectable, Inject, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ChatModelRouterService } from '../../../chat/services/providers/chat-model-router.service';
import { PropertyType } from '../../domain/value-objects/property-type.enum';
import { ILogger } from '../interfaces/logger.interface';
import {
  ExtractedPropertyFieldsDto,
  ExtractPropertyResponseDto,
} from '../../../properties/presentation/dtos/extract-property.dto';

/** Campos obrigatórios no formulário de cadastro (espelha createPropertySchema do front). */
const REQUIRED_FIELDS = ['title', 'description', 'type', 'price', 'neighborhood', 'city', 'area'] as const;

const MAX_TITLE_LENGTH = 255;
const MAX_SHORT_TEXT_LENGTH = 255;
/** Teto de sanidade: acima disso é quase certo erro de leitura (ex.: CEP lido como preço). */
const MAX_PRICE = 1_000_000_000;
const MAX_AREA = 1_000_000;
const MAX_ROOM_COUNT = 100;

const EXTRACTION_TOOL = {
  type: 'function',
  function: {
    name: 'preencher_cadastro_imovel',
    description:
      'Registra os dados do imóvel identificados no texto fornecido pelo corretor. ' +
      'Omita qualquer campo que não esteja explícito no texto.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description:
            'Título curto e comercial para o anúncio (máx. 255 caracteres). Pode ser redigido a partir do conteúdo do texto.',
        },
        description: {
          type: 'string',
          description:
            'Descrição do imóvel em português, redigida a partir do texto. Não invente características que não foram mencionadas.',
        },
        type: {
          type: 'string',
          enum: Object.values(PropertyType),
          description: 'Tipo do imóvel. Só preencha se der para inferir com segurança.',
        },
        price: {
          type: 'number',
          description:
            'Preço em reais, como número puro (ex.: "R$ 1,25 milhão" -> 1250000; "R$ 850 mil" -> 850000).',
        },
        neighborhood: { type: 'string', description: 'Bairro ou praia.' },
        city: { type: 'string', description: 'Cidade.' },
        bedrooms: { type: 'integer', description: 'Número de quartos/dormitórios.' },
        bathrooms: { type: 'integer', description: 'Número de banheiros.' },
        area: { type: 'number', description: 'Área em metros quadrados, como número puro.' },
        garageSpaces: { type: 'integer', description: 'Número de vagas de garagem.' },
        hasPool: { type: 'boolean', description: 'true apenas se o texto mencionar piscina.' },
        hasJacuzzi: { type: 'boolean', description: 'true apenas se o texto mencionar hidromassagem/jacuzzi.' },
        oceanFront: { type: 'boolean', description: 'true apenas se o texto disser que é pé na areia / frente ao mar.' },
        hasGarden: { type: 'boolean', description: 'true apenas se o texto mencionar jardim.' },
        hasGourmetArea: { type: 'boolean', description: 'true apenas se o texto mencionar área gourmet/churrasqueira.' },
        furnished: { type: 'boolean', description: 'true apenas se o texto disser que é mobiliado.' },
        warnings: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Ambiguidades ou suposições feitas na leitura (ex.: preço que pode ser aluguel ou venda). Em português, curtas.',
        },
      },
      required: [],
    },
  },
};

const SYSTEM_PROMPT = `Você extrai dados estruturados de imóveis a partir de texto livre em português do Brasil (anúncios, mensagens de WhatsApp, e-mails de proprietários).

Regras:
- Chame SEMPRE a função preencher_cadastro_imovel.
- Extraia apenas o que está no texto. Nunca invente bairro, cidade, preço, área ou características.
- Omita o campo quando a informação não estiver presente. Não use 0, "" ou null como preenchimento.
- Campos booleanos: marque true apenas quando a característica for mencionada. Nunca marque false explicitamente para "não mencionado" — apenas omita.
- Números vêm sem formatação: "R$ 1.250.000,00" -> 1250000; "180 m²" -> 180; "1,2 milhão" -> 1200000.
- title e description podem ser redigidos por você a partir do conteúdo, mas sem acrescentar fatos.
- Se o texto não descrever um imóvel, chame a função sem nenhum campo preenchido.`;

interface ExtractPropertyFromTextInput {
  text: string;
  requesterId: string;
}

@Injectable()
export class ExtractPropertyFromTextUseCase {
  constructor(
    private readonly chatModelRouter: ChatModelRouterService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(input: ExtractPropertyFromTextInput): Promise<ExtractPropertyResponseDto> {
    const { text, requesterId } = input;

    this.logger.info('[Properties] Extraindo dados de imóvel a partir de texto', {
      requesterId,
      textLength: text.length,
    });

    const raw = await this.callModel(text);
    const { fields, warnings } = this.sanitize(raw);

    const missingRequired = REQUIRED_FIELDS.filter(
      (field) => fields[field] === undefined,
    ) as string[];

    this.logger.info('[Properties] Extração concluída', {
      requesterId,
      extractedFields: Object.keys(fields),
      missingRequired,
    });

    return { fields, missingRequired, warnings };
  }

  /** Chama o provider configurado (OpenAI ou Claude) e devolve os argumentos da tool call. */
  private async callModel(text: string): Promise<Record<string, unknown>> {
    let completion;

    try {
      completion = await this.chatModelRouter.complete(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        [EXTRACTION_TOOL],
        SYSTEM_PROMPT,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error('[Properties] Falha ao chamar o provedor de IA na extração', { reason });
      throw new ServiceUnavailableException(
        'O serviço de IA está indisponível no momento. Preencha o formulário manualmente ou tente novamente.',
      );
    }

    const toolCall = completion?.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      // O modelo respondeu em texto em vez de chamar a função — sem dados utilizáveis.
      this.logger.warn('[Properties] Modelo não chamou a função de extração', {
        content: completion?.choices?.[0]?.message?.content?.slice(0, 200),
      });
      throw new UnprocessableEntityException(
        'Não foi possível identificar dados de imóvel neste texto. Revise o conteúdo e tente novamente.',
      );
    }

    try {
      const parsed = JSON.parse(toolCall.function.arguments || '{}');
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
      this.logger.error('[Properties] Argumentos da tool call não são JSON válido', {
        arguments: toolCall.function.arguments?.slice(0, 200),
      });
      throw new UnprocessableEntityException('A IA devolveu uma resposta inválida. Tente novamente.');
    }
  }

  /**
   * Normaliza a saída do modelo. Nada aqui confia no LLM: cada campo é
   * validado por tipo e faixa, e o que não passar é simplesmente descartado —
   * um campo ausente faz o corretor preencher à mão, o que é sempre seguro.
   */
  private sanitize(raw: Record<string, unknown>): {
    fields: ExtractedPropertyFieldsDto;
    warnings: string[];
  } {
    const fields: ExtractedPropertyFieldsDto = {};
    const warnings: string[] = [];

    const title = this.toText(raw.title, MAX_TITLE_LENGTH);
    if (title) fields.title = title;

    const description = this.toText(raw.description, 5000);
    if (description) fields.description = description;

    if (typeof raw.type === 'string') {
      const candidate = raw.type.trim().toUpperCase();
      if ((Object.values(PropertyType) as string[]).includes(candidate)) {
        fields.type = candidate as PropertyType;
      }
    }

    const neighborhood = this.toText(raw.neighborhood, MAX_SHORT_TEXT_LENGTH);
    if (neighborhood) fields.neighborhood = neighborhood;

    const city = this.toText(raw.city, MAX_SHORT_TEXT_LENGTH);
    if (city) fields.city = city;

    // Preço e área são decimais com 2 casas (o schema do formulário exige multipleOf 0.01).
    const price = this.toNumber(raw.price, MAX_PRICE);
    if (price !== undefined) fields.price = Math.round(price * 100) / 100;

    const area = this.toNumber(raw.area, MAX_AREA);
    if (area !== undefined) fields.area = Math.round(area * 100) / 100;

    const bedrooms = this.toInteger(raw.bedrooms, MAX_ROOM_COUNT);
    if (bedrooms !== undefined) fields.bedrooms = bedrooms;

    const bathrooms = this.toInteger(raw.bathrooms, MAX_ROOM_COUNT);
    if (bathrooms !== undefined) fields.bathrooms = bathrooms;

    const garageSpaces = this.toInteger(raw.garageSpaces, MAX_ROOM_COUNT);
    if (garageSpaces !== undefined) fields.garageSpaces = garageSpaces;

    // Booleanos: só propagamos `true`. `false` do modelo é ruído — significa
    // "não mencionado", e o formulário já nasce com todos desmarcados.
    const amenities = ['hasPool', 'hasJacuzzi', 'oceanFront', 'hasGarden', 'hasGourmetArea', 'furnished'] as const;
    for (const amenity of amenities) {
      if (raw[amenity] === true) {
        fields[amenity] = true;
      }
    }

    if (Array.isArray(raw.warnings)) {
      for (const warning of raw.warnings) {
        const text = this.toText(warning, 300);
        if (text) warnings.push(text);
      }
    }

    return { fields, warnings: warnings.slice(0, 5) };
  }

  private toText(value: unknown, maxLength: number): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
  }

  private toNumber(value: unknown, max: number): number | undefined {
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > max) return undefined;
    return parsed;
  }

  private toInteger(value: unknown, max: number): number | undefined {
    const parsed = this.toNumber(value, max);
    if (parsed === undefined) return undefined;
    return Math.round(parsed);
  }
}
