import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormattedResponse } from '../interfaces/chat-response.interface';

export class ChatToolUsage {
  @ApiProperty({ description: 'Nome da tool utilizada', example: 'events_search' })
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
      events: [
        { id: 'evt_1', title: 'Festival de Música', city: 'São Paulo', date: '2025-11-20T20:00:00Z' },
        { id: 'evt_2', title: 'Tech Summit', city: 'São Paulo', date: '2025-12-05T09:00:00Z' }
      ],
    },
    type: 'object',
  })
  data?: {
    events?: unknown[];
    event?: unknown;
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


