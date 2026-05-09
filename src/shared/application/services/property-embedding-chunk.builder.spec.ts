import { buildPropertyEmbeddingChunk, dtoHasSemanticChange } from './property-embedding-chunk.builder';
import { PropertyType } from '../../domain/value-objects/property-type.enum';
import { PropertyPurpose } from '../../domain/value-objects/property-purpose.enum';

describe('buildPropertyEmbeddingChunk', () => {
  const base = {
    title: 'Casa de Praia',
    description: 'Linda casa em frente ao mar',
    type: PropertyType.CASA,
    purpose: PropertyPurpose.SALE,
    price: 850000,
    neighborhood: 'Maresias',
    city: 'São Sebastião',
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    garageSpaces: 2,
    hasPool: true,
    hasJacuzzi: false,
    oceanFront: true,
    hasGarden: true,
    hasGourmetArea: true,
    furnished: false,
  };

  it('é determinístico para a mesma entrada', () => {
    expect(buildPropertyEmbeddingChunk(base)).toBe(buildPropertyEmbeddingChunk(base));
  });

  it('traduz enums para PT-BR', () => {
    const chunk = buildPropertyEmbeddingChunk(base);
    expect(chunk).toContain('Tipo: Casa');
    expect(chunk).toContain('Finalidade: Venda');
  });

  it('inclui local, características e amenidades', () => {
    const chunk = buildPropertyEmbeddingChunk(base);
    expect(chunk).toContain('Local: Maresias, São Sebastião');
    expect(chunk).toContain('Quartos: 3');
    expect(chunk).toContain('Banheiros: 2');
    expect(chunk).toContain('Vagas: 2');
    expect(chunk).toContain('Comodidades: piscina, frente para o mar, jardim, área gourmet');
  });

  it('omite seção de comodidades quando todos os booleanos são false', () => {
    const chunk = buildPropertyEmbeddingChunk({
      ...base,
      hasPool: false,
      hasJacuzzi: false,
      oceanFront: false,
      hasGarden: false,
      hasGourmetArea: false,
      furnished: false,
    });
    expect(chunk).not.toContain('Comodidades:');
  });

  it('formata preço em BRL', () => {
    const chunk = buildPropertyEmbeddingChunk(base);
    expect(chunk).toMatch(/Preço: R\$\s*850\.000,00/);
  });

  it('omite quartos/banheiros/vagas quando ausentes', () => {
    const chunk = buildPropertyEmbeddingChunk({
      ...base,
      bedrooms: null,
      bathrooms: null,
      garageSpaces: null,
    });
    expect(chunk).not.toContain('Quartos:');
    expect(chunk).not.toContain('Banheiros:');
    expect(chunk).not.toContain('Vagas:');
    expect(chunk).toContain('Área:');
  });
});

describe('dtoHasSemanticChange', () => {
  it('retorna true quando algum campo semântico está presente', () => {
    expect(dtoHasSemanticChange({ price: 100 })).toBe(true);
    expect(dtoHasSemanticChange({ description: 'novo' })).toBe(true);
    expect(dtoHasSemanticChange({ hasPool: false })).toBe(true);
  });

  it('retorna false quando só campos não-semânticos estão presentes', () => {
    expect(dtoHasSemanticChange({ coverImageUrl: 'http://x.png' })).toBe(false);
    expect(dtoHasSemanticChange({})).toBe(false);
  });
});
