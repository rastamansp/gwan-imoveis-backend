import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, Inject, UseFilters } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiExtension, ApiBody, ApiParam, ApiExtraModels, getSchemaPath, ApiOkResponse } from '@nestjs/swagger';
import { CreateEventUseCase } from '../shared/application/use-cases/create-event.use-case';
import { GetEventByIdUseCase } from '../shared/application/use-cases/get-event-by-id.use-case';
import { ListEventsUseCase } from '../shared/application/use-cases/list-events.use-case';
import { CreateEventDto } from '../shared/presentation/dtos/create-event.dto';
import { UpdateEventDto } from '../shared/presentation/dtos/update-event.dto';
import { CreateTicketCategoryDto } from '../shared/presentation/dtos/create-ticket-category.dto';
import { EventResponseDto } from '../shared/presentation/dtos/event-response.dto';
import { IEventRepository } from '../shared/domain/interfaces/event-repository.interface';
import { ITicketCategoryRepository } from '../shared/domain/interfaces/ticket-category-repository.interface';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { Event } from '../shared/domain/entities/event.entity';
import { TicketCategory } from '../shared/domain/entities/ticket-category.entity';
import { InsufficientPermissionsFilter } from '../shared/presentation/filters/insufficient-permissions.filter';
import { AddTicketCategoriesToEventUseCase } from '../shared/application/use-cases/add-ticket-categories-to-event.use-case';
import { SearchEventsByQueryUseCase } from '../shared/application/use-cases/search-events-by-query.use-case';
import { SearchEventsRagUseCase } from '../shared/application/use-cases/search-events-rag.use-case';
import { IEmbeddingService } from '../shared/application/interfaces/embedding-service.interface';
import { EventContentService } from '../shared/infrastructure/services/event-content.service';

@ApiTags('Eventos')
@ApiExtraModels(CreateTicketCategoryDto)
@Controller('events')
export class EventsController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly getEventByIdUseCase: GetEventByIdUseCase,
    private readonly listEventsUseCase: ListEventsUseCase,
    private readonly addTicketCategoriesToEventUseCase: AddTicketCategoriesToEventUseCase,
    private readonly searchEventsByQueryUseCase: SearchEventsByQueryUseCase,
    private readonly searchEventsRagUseCase: SearchEventsRagUseCase,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ITicketCategoryRepository')
    private readonly ticketCategoryRepository: ITicketCategoryRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    @Inject('IEmbeddingService')
    private readonly embeddingService: IEmbeddingService,
    private readonly eventContentService: EventContentService,
  ) {}

  @Get('test')
  @ApiOperation({ summary: 'Teste de endpoint' })
  async test(): Promise<{ message: string }> {
    return { message: 'Events endpoint funcionando' };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os eventos' })
  @ApiResponse({ status: 200, description: 'Lista de eventos obtida com sucesso' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'city', required: false, description: 'Filtrar por cidade' })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'list_events',
    description: 'Lista todos os eventos disponíveis. Pode filtrar por categoria e cidade.',
  })
  async findAll(@Query('category') category?: string, @Query('city') city?: string): Promise<EventResponseDto[]> {
    const events = await this.listEventsUseCase.execute(category, city);
    return events.map(event => EventResponseDto.fromEntity(event));
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar eventos por nome ou código' })
  @ApiResponse({ status: 200, description: 'Eventos encontrados com sucesso' })
  @ApiQuery({ name: 'query', required: true, description: 'Termo de busca (nome ou código)' })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'search_events_by_query',
    description: 'Busca eventos por nome (title) ou código (code).',
  })
  async search(@Query('query') query: string): Promise<EventResponseDto[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const events = await this.searchEventsByQueryUseCase.execute(query.trim());
    return events.map(e => EventResponseDto.fromEntity(e));
  }

  @Get('search/rag')
  @ApiOperation({ summary: 'Buscar eventos usando RAG (busca semântica)', description: 'Busca eventos por similaridade semântica usando embeddings. Retorna eventos relevantes baseado no significado da query, não apenas palavras-chave exatas.' })
  @ApiResponse({ status: 200, description: 'Eventos encontrados com sucesso via busca semântica' })
  @ApiQuery({ name: 'query', required: true, description: 'Query de busca semântica (ex: "show de música em São Paulo", "evento infantil")' })
  @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de resultados (padrão: 10)', type: Number })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'search_events_rag',
    description: 'Busca eventos por similaridade semântica usando embeddings. Permite encontrar eventos por significado/conceito, não apenas palavras-chave exatas. Exemplos: "show de música em São Paulo", "evento infantil para famílias", "festival de rock".',
  })
  async searchRag(@Query('query') query: string, @Query('limit') limit?: number): Promise<EventResponseDto[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const limitNum = limit ? Math.min(Math.max(1, limit), 50) : 10; // Entre 1 e 50
    const events = await this.searchEventsRagUseCase.execute(query.trim(), limitNum);
    return events.map(e => EventResponseDto.fromEntity(e));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter evento por ID' })
  @ApiResponse({ status: 200, description: 'Evento obtido com sucesso' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'get_event_by_id',
    description: 'Obter detalhes de um evento específico pelo ID.',
  })
  async findOne(@Param('id') id: string): Promise<EventResponseDto> {
    const event = await this.getEventByIdUseCase.execute(id);
    return EventResponseDto.fromEntity(event);
  }

  @Get(':id/ticket-categories')
  @ApiOperation({ summary: 'Obter categorias de ingressos do evento' })
  @ApiResponse({ status: 200, description: 'Categorias obtidas com sucesso' })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'get_event_ticket_categories',
    description: 'Listar categorias de ingressos disponíveis para um evento específico.',
  })
  async getTicketCategories(@Param('id') id: string): Promise<TicketCategory[]> {
    return this.ticketCategoryRepository.findByEventId(id);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @UseFilters(InsufficientPermissionsFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo evento' })
  @ApiResponse({ status: 201, description: 'Evento criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  async create(@Body() createEventDto: CreateEventDto, @Request() req: any): Promise<EventResponseDto> {
    const event = await this.createEventUseCase.execute(createEventDto, req.user.id);
    return EventResponseDto.fromEntity(event);
  }

  @Post(':id/ticket-categories')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseFilters(InsufficientPermissionsFilter)
  @ApiOperation({ summary: 'Criar categoria de ingresso' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  async createTicketCategory(
    @Param('id') eventId: string, 
    @Body() createTicketCategoryDto: CreateTicketCategoryDto,
    @Request() req: any,
  ): Promise<TicketCategory> {
    const userId = req.user.id;
    return this.addTicketCategoriesToEventUseCase.execute(eventId, userId, createTicketCategoryDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar evento' })
  @ApiResponse({ status: 200, description: 'Evento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto): Promise<EventResponseDto> {
    const existingEvent = await this.getEventByIdUseCase.execute(id);
    
    const updatedEvent = existingEvent.updateDetails(
      updateEventDto.title || existingEvent.title,
      updateEventDto.description || existingEvent.description,
      updateEventDto.date ? new Date(updateEventDto.date) : existingEvent.date,
      updateEventDto.location || existingEvent.location,
      updateEventDto.address || existingEvent.address,
      updateEventDto.city || existingEvent.city,
      updateEventDto.state || existingEvent.state,
      updateEventDto.image || existingEvent.image,
      updateEventDto.category || existingEvent.category,
      updateEventDto.maxCapacity || existingEvent.maxCapacity,
    );

    const savedEvent = await this.eventRepository.update(id, updatedEvent);

    if (!savedEvent) {
      throw new Error('Event not found after update');
    }

    // Gerar embeddings em background (não bloquear atualização do evento)
    this.logger.info('Iniciando geração de embedding após atualização', {
      eventId: savedEvent.id,
      title: savedEvent.title,
    });

    this.generateEventEmbedding(savedEvent.id)
      .then(() => {
        this.logger.info('Embedding gerado com sucesso após atualização', {
          eventId: savedEvent.id,
        });
      })
      .catch(error => {
        this.logger.error('Erro ao gerar embedding do evento após atualização', {
          eventId: savedEvent.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      });

    return EventResponseDto.fromEntity(savedEvent);
  }

  @Put('ticket-categories/:categoryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar categoria de ingresso (parcial)' , description: 'Permite atualizar campos específicos da categoria (name, description, price, maxQuantity, benefits). Envie apenas os campos a serem alterados.' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria de ingresso (UUID)', example: 'c0a8012b-3f2a-4e59-9af8-2a0b1d2c3e4f' })
  @ApiBody({
    description: 'Campos a atualizar na categoria de ingresso',
    schema: {
      $ref: getSchemaPath(CreateTicketCategoryDto),
    },
    examples: {
      atualizarPreco: {
        summary: 'Atualizar apenas o preço',
        value: { price: 150.00 },
      },
      atualizarNomeEBeneficios: {
        summary: 'Atualizar nome e benefícios',
        value: { name: 'Pista Premium', benefits: ['Área exclusiva', 'Acesso antecipado'] },
      },
      atualizarQuantidadeMaxima: {
        summary: 'Atualizar quantidade máxima',
        value: { maxQuantity: 500 },
      },
    },
  })
  @ApiOkResponse({
    description: 'Categoria atualizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'c0a8012b-3f2a-4e59-9af8-2a0b1d2c3e4f' },
        eventId: { type: 'string', example: 'ab1eb579-9fde-4a9b-b596-f0bc83649ac0' },
        name: { type: 'string', example: 'Pista Premium' },
        description: { type: 'string', example: 'Acesso a área exclusiva e bar dedicado' },
        price: { type: 'number', example: 150.0 },
        maxQuantity: { type: 'number', example: 500 },
        benefits: { type: 'array', items: { type: 'string' }, example: ['Área exclusiva', 'Acesso antecipado'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async updateTicketCategory(@Param('categoryId') categoryId: string, @Body() updateData: Partial<CreateTicketCategoryDto>): Promise<TicketCategory> {
    const existingCategory = await this.ticketCategoryRepository.findById(categoryId);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    existingCategory.updateDetails(
      updateData.name || existingCategory.name,
      updateData.description || existingCategory.description,
      updateData.price || existingCategory.price,
      updateData.maxQuantity || existingCategory.maxQuantity,
      updateData.benefits || existingCategory.benefits,
    );

    const savedCategory = await this.ticketCategoryRepository.update(categoryId, existingCategory);
    return savedCategory!;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar evento' })
  @ApiResponse({ status: 200, description: 'Evento deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = await this.eventRepository.delete(id);
    if (!deleted) {
      throw new Error('Event not found');
    }
    return { message: 'Event deleted successfully' };
  }

  @Delete('ticket-categories/:categoryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar categoria de ingresso', description: 'Remove uma categoria de ingresso do evento. Requer autenticação de organizador do evento.' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria de ingresso (UUID)', example: 'c0a8012b-3f2a-4e59-9af8-2a0b1d2c3e4f' })
  @ApiResponse({ status: 200, description: 'Categoria deletada com sucesso', schema: { type: 'object', properties: { message: { type: 'string', example: 'Categoria deletada com sucesso' } } } })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async deleteTicketCategory(@Param('categoryId') categoryId: string): Promise<{ message: string }> {
    const existingCategory = await this.ticketCategoryRepository.findById(categoryId);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    const deleted = await this.ticketCategoryRepository.delete(categoryId);
    if (!deleted) {
      throw new Error('Falha ao deletar categoria');
    }
    return { message: 'Categoria deletada com sucesso' };
  }

  /**
   * Gera embedding e metadados para o evento
   * Executado de forma assíncrona após criação/atualização
   */
  private async generateEventEmbedding(eventId: string): Promise<void> {
    this.logger.info('Iniciando geração de embedding', { eventId });
    
    try {
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        this.logger.warn('Evento não encontrado para gerar embedding', { eventId });
        return;
      }

      this.logger.info('Evento encontrado, buscando categorias', {
        eventId,
        title: event.title,
      });

      // Buscar categorias de ingressos relacionadas
      const categories = await this.ticketCategoryRepository.findByEventId(eventId);
      this.logger.info('Categorias encontradas', {
        eventId,
        categoriesCount: categories.length,
      });

      // Construir metadados
      const metadata = this.eventContentService.buildEventMetadata(event, categories);
      this.logger.info('Metadados construídos', { eventId });

      // Gerar texto consolidado
      const textContent = this.eventContentService.buildTextContent(event, categories);
      this.logger.info('Texto consolidado gerado', {
        eventId,
        textLength: textContent.length,
      });

      // Gerar embedding
      this.logger.info('Gerando embedding via OpenAI', { eventId });
      const embedding = await this.embeddingService.generateEmbedding(textContent);
      const model = this.embeddingService.getModel();

      this.logger.info('Embedding gerado, atualizando evento', {
        eventId,
        embeddingDimension: embedding.length,
        model,
      });

      // Atualizar evento com metadata e embedding
      await this.eventRepository.updateEmbedding(eventId, metadata, embedding, model);

      this.logger.info('Embedding salvo com sucesso', {
        eventId,
        embeddingDimension: embedding.length,
        model,
      });
    } catch (error) {
      this.logger.error('Erro ao gerar embedding do evento', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Não propagar erro para não quebrar criação/atualização do evento
      throw error; // Re-throw para que o .catch() no controller possa logar também
    }
  }
}
