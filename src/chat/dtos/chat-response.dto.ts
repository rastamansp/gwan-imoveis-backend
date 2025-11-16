import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormattedResponse } from '../interfaces/chat-response.interface';

export class ChatToolUsage {
  @ApiProperty({ description: 'Nome da tool utilizada', example: 'list_properties' })
  name!: string;

  @ApiPropertyOptional({ description: 'Argumentos passados para a tool', example: { city: 'São Paulo' }, type: 'object' })
  arguments?: Record<string, unknown>;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Resposta em linguagem natural do agente' })
  answer!: string;

  @ApiPropertyOptional({ description: 'Lista de tools utilizadas na conversa', type: [ChatToolUsage] })
  toolsUsed?: ChatToolUsage[];

  @ApiPropertyOptional({
    description: 'Dados estruturados retornados por tools (quando aplicável)',
    example: {
      properties: [
        { id: 'prop_1', title: 'Casa de Praia Luxuosa', city: 'São Sebastião', type: 'CASA', price: 850000 },
        { id: 'prop_2', title: 'Apartamento no Centro', city: 'São Sebastião', type: 'APARTAMENTO', price: 350000 }
      ],
    },
    type: 'object',
  })
  data?: {
    properties?: unknown[];
    property?: unknown;
  };

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


