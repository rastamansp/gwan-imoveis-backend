import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CorretorOrAdminGuard } from '../auth/guards/corretor-or-admin.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ConversationFiltersDto } from './presentation/dtos/conversation-filters.dto';
import {
  ConversationResponseDto,
  PaginatedConversationsResponseDto,
} from './presentation/dtos/conversation-response.dto';
import { MessageResponseDto } from './presentation/dtos/message-response.dto';
import { ReplyConversationDto } from './presentation/dtos/reply-conversation.dto';
import { AssignConversationDto } from './presentation/dtos/assign-conversation.dto';
import { ListConversationsUseCase } from './use-cases/list-conversations.use-case';
import { GetConversationDetailUseCase } from './use-cases/get-conversation-detail.use-case';
import { ReplyConversationUseCase } from './use-cases/reply-conversation.use-case';
import { AssignConversationUseCase } from './use-cases/assign-conversation.use-case';
import { CloseConversationUseCase } from './use-cases/close-conversation.use-case';

@ApiTags('Conversas (Inbox WhatsApp)')
@Controller('conversations')
@UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(
    private readonly listConversationsUseCase: ListConversationsUseCase,
    private readonly getConversationDetailUseCase: GetConversationDetailUseCase,
    private readonly replyConversationUseCase: ReplyConversationUseCase,
    private readonly assignConversationUseCase: AssignConversationUseCase,
    private readonly closeConversationUseCase: CloseConversationUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar conversas do inbox',
    description:
      'ADMIN vê todas as conversas. CORRETOR vê apenas as atribuídas a ele. Suporta filtro por status e paginação.',
  })
  @ApiOkResponse({ type: PaginatedConversationsResponseDto })
  @ApiExtraModels(ConversationResponseDto, PaginatedConversationsResponseDto)
  async list(
    @Query() filters: ConversationFiltersDto,
    @Request() req: any,
  ): Promise<PaginatedConversationsResponseDto> {
    const result = await this.listConversationsUseCase.execute({
      requesterId: req.user.id,
      requesterRole: req.user.role,
      filters: {
        status: filters.status,
        page: filters.page,
        limit: filters.limit,
      },
    });

    return {
      data: result.data.map((c) => ConversationResponseDto.fromEntity(c)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe da conversa com mensagens paginadas',
    description: 'Retorna os dados da conversa e o histórico de mensagens. CORRETOR só acessa a própria conversa.',
  })
  @ApiParam({ name: 'id', description: 'UUID da conversa', type: String })
  @ApiOkResponse({ type: ConversationResponseDto })
  async detail(
    @Param('id') id: string,
    @Query('messagesPage') messagesPage = 1,
    @Query('messagesLimit') messagesLimit = 50,
    @Request() req: any,
  ): Promise<ConversationResponseDto & { messagesTotal: number; messagesPage: number; messagesLimit: number }> {
    const result = await this.getConversationDetailUseCase.execute({
      conversationId: id,
      requesterId: req.user.id,
      requesterRole: req.user.role,
      messagesPage: Number(messagesPage),
      messagesLimit: Number(messagesLimit),
    });

    const dto = ConversationResponseDto.fromEntity(result.conversation) as any;
    dto.messages = result.messages.map(MessageResponseDto.fromEntity);
    dto.messagesTotal = result.messagesTotal;
    dto.messagesPage = result.messagesPage;
    dto.messagesLimit = result.messagesLimit;
    return dto;
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Responder via WhatsApp',
    description: 'Envia uma mensagem de texto ao cliente via Evolution API e salva no histórico.',
  })
  @ApiParam({ name: 'id', description: 'UUID da conversa', type: String })
  @ApiBody({ type: ReplyConversationDto })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Conversa encerrada ou texto inválido' })
  @ApiResponse({ status: 403, description: 'Conversa não atribuída a você' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  async reply(
    @Param('id') id: string,
    @Body() dto: ReplyConversationDto,
    @Request() req: any,
  ): Promise<MessageResponseDto> {
    const message = await this.replyConversationUseCase.execute({
      conversationId: id,
      requesterId: req.user.id,
      requesterRole: req.user.role,
      text: dto.text,
    });
    return MessageResponseDto.fromEntity(message);
  }

  @Put(':id/assign')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Atribuir conversa a um corretor (apenas ADMIN)',
    description: 'Atribui uma conversa a um corretor específico. Apenas administradores podem realizar esta ação.',
  })
  @ApiParam({ name: 'id', description: 'UUID da conversa', type: String })
  @ApiBody({ type: AssignConversationDto })
  @ApiResponse({ status: 200, description: 'Conversa atribuída com sucesso' })
  @ApiResponse({ status: 400, description: 'Usuário alvo não é um corretor' })
  @ApiResponse({ status: 404, description: 'Conversa ou corretor não encontrado' })
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ): Promise<{ message: string }> {
    await this.assignConversationUseCase.execute({
      conversationId: id,
      realtorId: dto.realtorId,
    });
    return { message: 'Conversa atribuída com sucesso' };
  }

  @Put(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Encerrar conversa',
    description: 'Encerra uma conversa ativa. CORRETOR só pode encerrar as próprias; ADMIN pode encerrar qualquer.',
  })
  @ApiParam({ name: 'id', description: 'UUID da conversa', type: String })
  @ApiResponse({ status: 200, description: 'Conversa encerrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Conversa já encerrada' })
  @ApiResponse({ status: 403, description: 'Conversa não atribuída a você' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  async close(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    await this.closeConversationUseCase.execute({
      conversationId: id,
      requesterId: req.user.id,
      requesterRole: req.user.role,
    });
    return { message: 'Conversa encerrada com sucesso' };
  }
}
