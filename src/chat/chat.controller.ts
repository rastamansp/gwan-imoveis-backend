import { Body, Controller, HttpCode, Post, Request, Inject } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dtos/chat-request.dto';
import { ChatResponseDto } from './dtos/chat-response.dto';
import { CreateOrFindConversationUseCase } from '../shared/application/use-cases/create-or-find-conversation.use-case';
import { SaveMessageUseCase } from '../shared/application/use-cases/save-message.use-case';
import { IConversationRepository } from '../shared/domain/interfaces/conversation-repository.interface';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { MessageDirection } from '../shared/domain/value-objects/message-direction.enum';
import { MessageChannel } from '../shared/domain/value-objects/message-channel.enum';

@ApiTags('Chat')
@ApiExtraModels(ChatResponseDto)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly createOrFindConversationUseCase: CreateOrFindConversationUseCase,
    private readonly saveMessageUseCase: SaveMessageUseCase,
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

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
  public async chat(@Body() body: ChatRequestDto, @Request() req?: any): Promise<ChatResponseDto> {
    // Determinar número de telefone e userId
    let phoneNumber: string | undefined = body.phoneNumber;
    let userId: string | null = null;

    // Se usuário autenticado e não forneceu phoneNumber, usar whatsappNumber do usuário
    if (req?.user && !phoneNumber) {
      const user = await this.userRepository.findById(req.user.id);
      if (user?.whatsappNumber) {
        phoneNumber = user.whatsappNumber;
        userId = user.id;
      }
    }

    // Criar ou buscar conversa se sessionId ou phoneNumber fornecidos
    let conversationId: string | null = null;
    if (body.sessionId) {
      // Buscar conversa existente
      const conversation = await this.conversationRepository.findById(body.sessionId);
      if (conversation) {
        conversationId = conversation.id;
        // Atualizar userId se necessário
        if (userId && !conversation.userId) {
          conversation.associateUser(userId);
          await this.conversationRepository.save(conversation);
        }
      }
    } else if (phoneNumber) {
      // Criar ou buscar conversa por número de telefone
      const conversation = await this.createOrFindConversationUseCase.execute({
        phoneNumber,
        instanceName: 'api-chat', // Instância padrão para chat via API
        userId,
      });
      conversationId = conversation.id;
    }

    // Chamar serviço de chat com canal WEB
    const result = await this.chatService.chat(body.message, body.userCtx, MessageChannel.WEB);

    // Salvar mensagens se tiver conversa
    if (conversationId) {
      // Obter conversa para pegar phoneNumber
      const conversation = await this.conversationRepository.findById(conversationId);
      const messagePhoneNumber = conversation?.phoneNumber || phoneNumber || null;

      // Salvar mensagem do usuário (incoming)
      await this.saveMessageUseCase.execute({
        conversationId,
        content: body.message,
        direction: MessageDirection.INCOMING,
        messageId: null, // Mensagem via API não tem messageId do WhatsApp
        phoneNumber: messagePhoneNumber,
        channel: MessageChannel.WEB,
        timestamp: new Date(),
      });

      // Salvar resposta do chat (outgoing)
      await this.saveMessageUseCase.execute({
        conversationId,
        content: result.answer,
        direction: MessageDirection.OUTGOING,
        messageId: null,
        phoneNumber: messagePhoneNumber,
        channel: MessageChannel.WEB,
        timestamp: new Date(),
        response: result.answer,
        toolsUsed: result.toolsUsed || null,
      });
    }

    // Retornar resposta com sessionId e dados formatados
    return {
      ...result,
      sessionId: conversationId || undefined,
      formattedResponse: result.formattedResponse,
    };
  }
}


