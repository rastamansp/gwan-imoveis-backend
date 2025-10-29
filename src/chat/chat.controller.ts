import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dtos/chat-request.dto';
import { ChatResponseDto } from './dtos/chat-response.dto';

@ApiTags('Chat')
@ApiExtraModels(ChatResponseDto)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Agente conversacional (OpenAI + MCP bridge)' })
  @ApiBody({
    description: 'Mensagem do usuário e contexto opcional',
    type: ChatRequestDto,
    examples: {
      listaEventos: {
        summary: 'Listar eventos com filtros',
        value: { message: 'Liste eventos de Música em São Paulo' },
      },
      detalhesEvento: {
        summary: 'Detalhes de um evento específico',
        value: { message: 'Mostre os detalhes do evento ab1eb579-9fde-4a9b-b596-f0bc83649ac0' },
      },
      comContexto: {
        summary: 'Com contexto do usuário',
        value: { message: 'Sugira eventos para hoje', userCtx: { city: 'São Paulo', date: '2025-10-29' } },
      },
      precosEvento: {
        summary: 'Preços de ingressos de um evento (por ID)',
        value: { message: 'Quais os preços dos ingressos do evento ab1eb579-9fde-4a9b-b596-f0bc83649ac0?' },
      },
      buscaPorNome: {
        summary: 'Buscar eventos por título/palavra-chave',
        value: { message: 'Busque eventos com o nome Festival' },
      },
      buscaPorCodigo: {
        summary: 'Buscar evento por código amigável',
        value: { message: 'Encontre o evento com código EVT-A1B2C3' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Resposta do agente',
    schema: {
      $ref: getSchemaPath(ChatResponseDto),
    },
  })
  public async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    const result = await this.chatService.chat(body.message, body.userCtx);
    return result;
  }
}


