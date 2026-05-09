import { PropertyPurpose } from '../../domain/value-objects/property-purpose.enum';
import { PropertyType } from '../../domain/value-objects/property-type.enum';

const TYPE_PT: Record<PropertyType, string> = {
  [PropertyType.CASA]: 'Casa',
  [PropertyType.APARTAMENTO]: 'Apartamento',
  [PropertyType.TERRENO]: 'Terreno',
  [PropertyType.SALA_COMERCIAL]: 'Sala Comercial',
};

const PURPOSE_PT: Record<PropertyPurpose, string> = {
  [PropertyPurpose.RENT]: 'Aluguel',
  [PropertyPurpose.SALE]: 'Venda',
  [PropertyPurpose.INVESTMENT]: 'Investimento',
};

export interface PropertyEmbeddingInput {
  title: string;
  description: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  price: number | string;
  neighborhood: string;
  city: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area: number | string;
  garageSpaces?: number | null;
  hasPool?: boolean;
  hasJacuzzi?: boolean;
  oceanFront?: boolean;
  hasGarden?: boolean;
  hasGourmetArea?: boolean;
  furnished?: boolean;
}

export function buildPropertyEmbeddingChunk(p: PropertyEmbeddingInput): string {
  const lines: string[] = [];

  lines.push(`Tipo: ${TYPE_PT[p.type] ?? p.type} | Finalidade: ${PURPOSE_PT[p.purpose] ?? p.purpose} | Local: ${p.neighborhood}, ${p.city}`);

  const parts: string[] = [];
  if (p.bedrooms != null) parts.push(`Quartos: ${p.bedrooms}`);
  if (p.bathrooms != null) parts.push(`Banheiros: ${p.bathrooms}`);
  if (p.garageSpaces != null) parts.push(`Vagas: ${p.garageSpaces}`);
  parts.push(`Área: ${formatNumber(p.area)}m²`);
  lines.push(parts.join(' | '));

  lines.push(`Preço: ${formatPrice(p.price)}`);

  const amenities: string[] = [];
  if (p.hasPool) amenities.push('piscina');
  if (p.hasJacuzzi) amenities.push('hidromassagem');
  if (p.oceanFront) amenities.push('frente para o mar');
  if (p.hasGarden) amenities.push('jardim');
  if (p.hasGourmetArea) amenities.push('área gourmet');
  if (p.furnished) amenities.push('mobiliado');
  if (amenities.length > 0) {
    lines.push(`Comodidades: ${amenities.join(', ')}`);
  }

  lines.push(`Título: ${p.title}`);
  lines.push(`Descrição: ${p.description}`);

  return lines.join('\n');
}

const SEMANTIC_FIELDS: ReadonlyArray<string> = [
  'title',
  'description',
  'type',
  'purpose',
  'price',
  'neighborhood',
  'city',
  'bedrooms',
  'bathrooms',
  'area',
  'garageSpaces',
  'hasPool',
  'hasJacuzzi',
  'oceanFront',
  'hasGarden',
  'hasGourmetArea',
  'furnished',
];

export function dtoHasSemanticChange(dto: Record<string, unknown>): boolean {
  return SEMANTIC_FIELDS.some((field) => dto[field] !== undefined);
}

function formatNumber(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatPrice(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
