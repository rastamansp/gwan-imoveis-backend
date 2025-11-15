import { Body, Controller, HttpCode, Post, Request, Inject } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ChatbotHealthQueryUseCase, ChatbotHealthQueryResult } from '../shared/application/use-cases/chatbot-health-query.use-case';
import { ChatHealthRequestDto } from './dtos/chat-health-request.dto';
import { ChatHealthResponseDto, DiseaseInfoDto } from './dtos/chat-health-response.dto';
import { CreateOrFindConversationUseCase } from '../shared/application/use-cases/create-or-find-conversation.use-case';
import { SaveMessageUseCase } from '../shared/application/use-cases/save-message.use-case';
import { IConversationRepository } from '../shared/domain/interfaces/conversation-repository.interface';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { MessageDirection } from '../shared/domain/value-objects/message-direction.enum';
import { MessageChannel } from '../shared/domain/value-objects/message-channel.enum';
import { WhatsAppFormatterService } from '../chat/services/formatters/whatsapp-formatter.service';
import { ResponseFormatterService } from '../chat/services/response-formatter.service';

@ApiTags('Chat Health')
@ApiExtraModels(ChatHealthResponseDto)
@Controller('chat-health')
export class ChatHealthController {
  constructor(
    private readonly chatbotHealthQueryUseCase: ChatbotHealthQueryUseCase,
    private readonly createOrFindConversationUseCase: CreateOrFindConversationUseCase,
    private readonly saveMessageUseCase: SaveMessageUseCase,
    private readonly responseFormatter: ResponseFormatterService,
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Chatbot de saúde - Consulta sobre doenças, causas, tratamentos e plantas indicadas',
    description: 'Consulta a base de conhecimento sobre doenças usando busca semântica com embeddings. Retorna informações sobre doenças, causas, tratamentos e plantas medicinais indicadas.',
  })
  @ApiBody({
    description: 'Consulta sobre doença e contexto opcional',
    type: ChatHealthRequestDto,
    examples: {
      consultaSimples: {
        summary: 'Consulta simples sobre doença',
        value: { query: 'dor de cabeça e febre' },
      },
      consultaPorNome: {
        summary: 'Consulta por nome de doença',
        value: { query: 'FEBRE' },
      },
      comSessao: {
        summary: 'Consulta com sessão existente',
        value: { 
          query: 'quais plantas são indicadas para gripe?',
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
      comTelefone: {
        summary: 'Consulta com número de telefone',
        value: { 
          query: 'tratamento para dor de estômago',
          phoneNumber: '5511999999999',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Resposta do chatbot de saúde com informações sobre a doença',
    schema: {
      $ref: getSchemaPath(ChatHealthResponseDto),
    },
  })
  public async chatHealth(
    @Body() body: ChatHealthRequestDto,
    @Request() req?: any,
  ): Promise<ChatHealthResponseDto> {
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

    // Criar ou buscar conversa se sessionId, phoneNumber ou usuário fornecidos
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
      } else {
        // Se sessionId foi fornecido mas não existe, criar nova conversa
        // Isso permite que o cliente crie uma sessão explicitamente
        const newConversation = await this.createOrFindConversationUseCase.execute({
          phoneNumber: phoneNumber || `api-session-${Date.now()}`, // Usar phoneNumber ou gerar um temporário
          instanceName: 'api-chat-health',
          userId,
        });
        conversationId = newConversation.id;
      }
    } else if (phoneNumber) {
      // Criar ou buscar conversa por número de telefone
      const conversation = await this.createOrFindConversationUseCase.execute({
        phoneNumber,
        instanceName: 'api-chat-health', // Instância padrão para chat health via API
        userId,
      });
      conversationId = conversation.id;
    } else {
      // Se não houver sessionId nem phoneNumber, ainda assim criar uma sessão
      // para permitir que o frontend mantenha o contexto entre requisições
      const apiSessionPhone = `api-session-${Date.now()}`;
      const conversation = await this.createOrFindConversationUseCase.execute({
        phoneNumber: apiSessionPhone,
        instanceName: 'api-chat-health',
        userId,
      });
      conversationId = conversation.id;
    }

    // Executar consulta no chatbot de saúde
    const result = await this.chatbotHealthQueryUseCase.execute(body.query);

    // Salvar mensagens se tiver conversa
    if (conversationId) {
      // Obter conversa para pegar phoneNumber
      const conversation = await this.conversationRepository.findById(conversationId);
      const messagePhoneNumber = conversation?.phoneNumber || phoneNumber || null;

      // Salvar mensagem do usuário (incoming)
      await this.saveMessageUseCase.execute({
        conversationId,
        content: body.query,
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
        toolsUsed: null,
      });
    }

    // Formatar resposta para WhatsApp se necessário
    let formattedResponse;
    if (conversationId) {
      formattedResponse = await this.responseFormatter.formatResponse(
        result.answer,
        MessageChannel.WHATSAPP,
        [],
        result.disease ? {
          disease: {
            name: result.disease.diseaseName,
            description: result.disease.description,
            causes: result.disease.causes,
            treatment: result.disease.treatment,
            plants: result.disease.plants,
          },
        } : null,
      );
    }

    // Montar resposta DTO
    const markdownAnswer = this.buildMarkdownAnswer(result);

    const response: ChatHealthResponseDto = {
      answer: result.answer,
      searchMethod: result.searchMethod,
      sessionId: conversationId || undefined,
      formattedResponse,
      markdownAnswer,
    };

    // Adicionar informações da doença se encontrada
    if (result.disease) {
      response.disease = {
        name: result.disease.diseaseName,
        description: result.disease.description,
        causes: result.disease.causes,
        treatment: result.disease.treatment,
        plants: result.disease.plants,
      };
    }

    // Adicionar similaridade se presente
    if (result.similarity !== undefined) {
      response.similarity = result.similarity;
    }

    // Adicionar alternativas
    if (result.alternatives && result.alternatives.length > 0) {
      response.alternatives = result.alternatives;
    }

    return response;
  }

  /**
   * Constrói uma versão em Markdown da resposta, para o frontend decidir como renderizar.
   * Quando houver doença estruturada, usa seções e títulos; caso contrário, usa o texto bruto.
   */
  private buildMarkdownAnswer(result: ChatbotHealthQueryResult): string {
    if (!result.disease) {
      return result.answer;
    }

    const disease = result.disease;
    const parts: string[] = [];

    // Título principal com o nome da doença
    parts.push(`## ${disease.diseaseName}`);

    if (disease.description) {
      parts.push('');
      parts.push('**Descrição**');
      parts.push('');
      parts.push(disease.description);
    }

    if (disease.causes) {
      parts.push('');
      parts.push('**Causas**');
      parts.push('');
      parts.push(disease.causes);
    }

    if (disease.treatment) {
      parts.push('');
      parts.push('**Tratamento**');
      parts.push('');
      parts.push(disease.treatment);
    }

    if (disease.plants) {
      parts.push('');
      parts.push('**Plantas indicadas**');
      parts.push('');
      parts.push(disease.plants);
    }

    return parts.join('\n');
  }
}

