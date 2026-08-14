import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType } from '../../../shared/domain/value-objects/property-type.enum';

/**
 * Texto livre (anúncio, mensagem de WhatsApp, e-mail do proprietário) do qual
 * a IA extrai os campos do imóvel para pré-preencher o formulário de cadastro.
 */
export class ExtractPropertyFromTextDto {
  @ApiProperty({
    description: 'Texto livre descrevendo o imóvel',
    example:
      'Vendo casa em Maresias, São Sebastião. 3 quartos, 2 banheiros, 180m², ' +
      'piscina e área gourmet, 2 vagas. R$ 1.250.000',
    minLength: 20,
    maxLength: 8000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Texto muito curto para extração (mínimo 20 caracteres)' })
  @MaxLength(8000, { message: 'Texto muito longo (máximo 8000 caracteres)' })
  text: string;
}

/**
 * Campos extraídos. Todos opcionais de propósito: a IA só devolve o que estava
 * explícito no texto, e o corretor revisa antes de salvar. Este DTO NÃO cria
 * nada — é apenas sugestão de preenchimento.
 */
export class ExtractedPropertyFieldsDto {
  @ApiPropertyOptional({ example: 'Casa em Maresias com piscina e área gourmet' })
  title?: string;

  @ApiPropertyOptional({ example: 'Casa de 180m² em Maresias, São Sebastião...' })
  description?: string;

  @ApiPropertyOptional({ enum: PropertyType, example: PropertyType.CASA })
  type?: PropertyType;

  @ApiPropertyOptional({ example: 1250000 })
  price?: number;

  @ApiPropertyOptional({ example: 'Maresias' })
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Sebastião' })
  city?: string;

  @ApiPropertyOptional({ example: 3 })
  bedrooms?: number;

  @ApiPropertyOptional({ example: 2 })
  bathrooms?: number;

  @ApiPropertyOptional({ example: 180 })
  area?: number;

  @ApiPropertyOptional({ example: 2 })
  garageSpaces?: number;

  @ApiPropertyOptional({ example: true })
  hasPool?: boolean;

  @ApiPropertyOptional({ example: false })
  hasJacuzzi?: boolean;

  @ApiPropertyOptional({ example: false })
  oceanFront?: boolean;

  @ApiPropertyOptional({ example: false })
  hasGarden?: boolean;

  @ApiPropertyOptional({ example: true })
  hasGourmetArea?: boolean;

  @ApiPropertyOptional({ example: false })
  furnished?: boolean;
}

export class ExtractPropertyResponseDto {
  @ApiProperty({
    type: ExtractedPropertyFieldsDto,
    description: 'Campos identificados no texto. Só vêm preenchidos os que a IA encontrou.',
  })
  fields: ExtractedPropertyFieldsDto;

  @ApiProperty({
    type: [String],
    description:
      'Campos obrigatórios do cadastro que a IA NÃO conseguiu identificar. O corretor precisa preenchê-los à mão.',
    example: ['city'],
  })
  missingRequired: string[];

  @ApiProperty({
    type: [String],
    description: 'Avisos sobre ambiguidades ou suposições feitas na leitura do texto.',
    example: ['Preço interpretado como valor de venda, não de aluguel.'],
  })
  warnings: string[];
}
