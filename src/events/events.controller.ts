import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiExtension } from '@nestjs/swagger';
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
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Eventos')
@Controller('events')
export class EventsController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly getEventByIdUseCase: GetEventByIdUseCase,
    private readonly listEventsUseCase: ListEventsUseCase,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ITicketCategoryRepository')
    private readonly ticketCategoryRepository: ITicketCategoryRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo evento' })
  @ApiResponse({ status: 201, description: 'Evento criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() createEventDto: CreateEventDto, @Request() req: any): Promise<EventResponseDto> {
    const event = await this.createEventUseCase.execute(createEventDto, req.user.id);
    return EventResponseDto.fromEntity(event);
  }

  @Post(':id/ticket-categories')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar categoria de ingresso' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async createTicketCategory(@Param('id') eventId: string, @Body() createTicketCategoryDto: CreateTicketCategoryDto): Promise<TicketCategory> {
    const category = new TicketCategory(
      uuidv4(),
      eventId,
      createTicketCategoryDto.name,
      createTicketCategoryDto.description,
      createTicketCategoryDto.price,
      createTicketCategoryDto.maxQuantity,
      0,
      createTicketCategoryDto.benefits || [],
      true,
    );

    return this.ticketCategoryRepository.save(category);
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
    return EventResponseDto.fromEntity(savedEvent!);
  }

  @Put('ticket-categories/:categoryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar categoria de ingresso' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async updateTicketCategory(@Param('categoryId') categoryId: string, @Body() updateData: Partial<CreateTicketCategoryDto>): Promise<TicketCategory> {
    const existingCategory = await this.ticketCategoryRepository.findById(categoryId);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    const updatedCategory = existingCategory.updateDetails(
      updateData.name || existingCategory.name,
      updateData.description || existingCategory.description,
      updateData.price || existingCategory.price,
      updateData.maxQuantity || existingCategory.maxQuantity,
      updateData.benefits || existingCategory.benefits,
    );

    const savedCategory = await this.ticketCategoryRepository.update(categoryId, updatedCategory);
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
}
