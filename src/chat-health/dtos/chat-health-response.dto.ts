import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormattedResponse } from '../../chat/interfaces/chat-response.interface';

export class DiseaseInfoDto {
  @ApiProperty({ description: 'Nome da doença', example: 'FEBRE' })
  name!: string;

  @ApiProperty({ description: 'Descrição completa da doença' })
  description!: string;

  @ApiPropertyOptional({ description: 'Causas da doença' })
  causes?: string | null;

  @ApiPropertyOptional({ description: 'Tratamento recomendado' })
  treatment?: string | null;

  @ApiPropertyOptional({ description: 'Plantas medicinais indicadas' })
  plants?: string | null;
}

export class DiseaseAlternativeDto {
  @ApiProperty({ description: 'Nome da doença alternativa', example: 'GRIPE' })
  name!: string;

  @ApiProperty({ description: 'Descrição resumida da doença' })
  description!: string;

  @ApiProperty({ description: 'Similaridade com a consulta (0-1)', example: 0.87 })
  similarity!: number;
}

export class ChatHealthResponseDto {
  @ApiProperty({ description: 'Resposta formatada sobre a doença' })
  answer!: string;

  @ApiPropertyOptional({
    description: 'Informações da doença encontrada',
    type: DiseaseInfoDto,
  })
  disease?: DiseaseInfoDto | null;

  @ApiPropertyOptional({
    description: 'Similaridade da busca (0-1), presente apenas em busca semântica',
    example: 0.87,
  })
  similarity?: number;

  @ApiProperty({
    description: 'Método de busca utilizado',
    enum: ['exact', 'partial', 'semantic', 'hybrid', 'none'],
    example: 'semantic',
  })
  searchMethod!: 'exact' | 'partial' | 'semantic' | 'hybrid' | 'none';

  @ApiPropertyOptional({
    description: 'Doenças alternativas relacionadas',
    type: [DiseaseAlternativeDto],
  })
  alternatives?: DiseaseAlternativeDto[];

  @ApiPropertyOptional({
    description: 'Resposta em formato Markdown para renderização pelo frontend',
    example: '## GRIPE\\n\\n**Descrição**: ...',
  })
  markdownAnswer?: string;

  @ApiPropertyOptional({
    description: 'ID da sessão de conversa (usado para manter contexto entre requisições)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Resposta formatada conforme o canal (WEB ou WHATSAPP)',
    type: 'object',
  })
  formattedResponse?: FormattedResponse;
}

