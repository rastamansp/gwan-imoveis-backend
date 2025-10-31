import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, Inject, UseFilters } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody, ApiExtraModels, ApiExtension } from '@nestjs/swagger';
import { CreateArtistUseCase } from '../shared/application/use-cases/create-artist.use-case';
import { GetArtistByIdUseCase } from '../shared/application/use-cases/get-artist-by-id.use-case';
import { ListArtistsUseCase } from '../shared/application/use-cases/list-artists.use-case';
import { SearchArtistsUseCase } from '../shared/application/use-cases/search-artists.use-case';
import { SearchArtistsRagUseCase } from '../shared/application/use-cases/search-artists-rag.use-case';
import { GetArtistsByEventUseCase } from '../shared/application/use-cases/get-artists-by-event.use-case';
import { UpdateArtistUseCase } from '../shared/application/use-cases/update-artist.use-case';
import { DeleteArtistUseCase } from '../shared/application/use-cases/delete-artist.use-case';
import { LinkArtistToEventUseCase } from '../shared/application/use-cases/link-artist-to-event.use-case';
import { UnlinkArtistFromEventUseCase } from '../shared/application/use-cases/unlink-artist-from-event.use-case';
import { CreateArtistDto } from '../shared/presentation/dtos/create-artist.dto';
import { UpdateArtistDto } from '../shared/presentation/dtos/update-artist.dto';
import { ArtistResponseDto } from '../shared/presentation/dtos/artist-response.dto';
import { ArtistDetailResponseDto } from '../shared/presentation/dtos/artist-detail-response.dto';
import { ArtistSearchFiltersDto } from '../shared/presentation/dtos/artist-search-filters.dto';
import { LinkArtistToEventDto } from '../shared/presentation/dtos/link-artist-to-event.dto';
import { ArtistSearchFilters } from '../shared/domain/value-objects/artist-search-filters';
import { InsufficientPermissionsFilter } from '../shared/presentation/filters/insufficient-permissions.filter';
import { IArtistRepository } from '../shared/domain/interfaces/artist-repository.interface';
import { IEmbeddingService } from '../shared/application/interfaces/embedding-service.interface';
import { ArtistContentService } from '../shared/infrastructure/services/artist-content.service';
import { ILogger } from '../shared/application/interfaces/logger.interface';

@ApiTags('Artistas')
@ApiExtraModels(CreateArtistDto, UpdateArtistDto, ArtistResponseDto, ArtistDetailResponseDto, ArtistSearchFiltersDto, LinkArtistToEventDto)
@Controller('artists')
export class ArtistsController {
  constructor(
    private readonly createArtistUseCase: CreateArtistUseCase,
    private readonly getArtistByIdUseCase: GetArtistByIdUseCase,
    private readonly listArtistsUseCase: ListArtistsUseCase,
    private readonly searchArtistsUseCase: SearchArtistsUseCase,
    private readonly searchArtistsRagUseCase: SearchArtistsRagUseCase,
    private readonly getArtistsByEventUseCase: GetArtistsByEventUseCase,
    private readonly updateArtistUseCase: UpdateArtistUseCase,
    private readonly deleteArtistUseCase: DeleteArtistUseCase,
    private readonly linkArtistToEventUseCase: LinkArtistToEventUseCase,
    private readonly unlinkArtistFromEventUseCase: UnlinkArtistFromEventUseCase,
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('IEmbeddingService')
    private readonly embeddingService: IEmbeddingService,
    private readonly artistContentService: ArtistContentService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os artistas' })
  @ApiResponse({ status: 200, description: 'Lista de artistas obtida com sucesso', type: [ArtistResponseDto] })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'list_artists',
    description: 'Lista todos os artistas cadastrados no sistema.',
  })
  async findAll(): Promise<ArtistResponseDto[]> {
    const artists = await this.listArtistsUseCase.execute();
    return artists.map(artist => ArtistResponseDto.fromEntity(artist));
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar artistas por filtros', description: 'Busca artistas usando filtros opcionais. Todos os filtros são opcionais e suportam busca parcial case-insensitive.' })
  @ApiResponse({ status: 200, description: 'Artistas encontrados com sucesso', type: [ArtistResponseDto] })
  @ApiQuery({ name: 'artisticName', required: false, description: 'Buscar por nome artístico' })
  @ApiQuery({ name: 'name', required: false, description: 'Buscar por nome completo' })
  @ApiQuery({ name: 'instagramUsername', required: false, description: 'Buscar por nome de usuário do Instagram' })
  @ApiQuery({ name: 'youtubeUsername', required: false, description: 'Buscar por nome de usuário do YouTube' })
  @ApiQuery({ name: 'xUsername', required: false, description: 'Buscar por nome de usuário do X/Twitter' })
  @ApiQuery({ name: 'spotifyUsername', required: false, description: 'Buscar por nome de usuário do Spotify' })
  @ApiQuery({ name: 'tiktokUsername', required: false, description: 'Buscar por nome de usuário do TikTok' })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'search_artists_by_query',
    description: 'Busca artistas usando filtros específicos (nome artístico, nome completo, redes sociais).',
  })
  async search(@Query() filters: ArtistSearchFiltersDto): Promise<ArtistResponseDto[]> {
    const searchFilters: ArtistSearchFilters = {
      artisticName: filters.artisticName,
      name: filters.name,
      instagramUsername: filters.instagramUsername,
      youtubeUsername: filters.youtubeUsername,
      xUsername: filters.xUsername,
      spotifyUsername: filters.spotifyUsername,
      tiktokUsername: filters.tiktokUsername,
    };
    
    const artists = await this.searchArtistsUseCase.execute(searchFilters);
    return artists.map(artist => ArtistResponseDto.fromEntity(artist));
  }

  @Get('search/rag')
  @ApiOperation({ summary: 'Buscar artistas usando RAG (busca semântica)', description: 'Busca artistas por similaridade semântica usando embeddings. Retorna artistas relevantes baseado no significado da query, não apenas palavras-chave exatas.' })
  @ApiResponse({ status: 200, description: 'Artistas encontrados com sucesso via busca semântica', type: [ArtistResponseDto] })
  @ApiQuery({ name: 'query', required: true, description: 'Query de busca semântica (ex: "artista de música gospel", "cantor sertanejo", "banda de rock")' })
  @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de resultados (padrão: 10)', type: Number })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'search_artists_rag',
    description: 'Busca artistas por similaridade semântica usando embeddings. Permite encontrar artistas por significado/conceito, não apenas palavras-chave exatas. Exemplos: "artista de música gospel", "cantor sertanejo", "banda de rock".',
  })
  async searchRag(@Query('query') query: string, @Query('limit') limit?: number): Promise<ArtistResponseDto[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const limitNum = limit ? Math.min(Math.max(1, limit), 50) : 10; // Entre 1 e 50
    const artists = await this.searchArtistsRagUseCase.execute(query.trim(), limitNum);
    return artists.map(artist => ArtistResponseDto.fromEntity(artist));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter artista por ID com eventos vinculados', description: 'Retorna todas as informações do artista, incluindo os eventos nos quais ele participa. Ideal para visualização da página do artista.' })
  @ApiResponse({ status: 200, description: 'Artista obtido com sucesso', type: ArtistDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Artista não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do artista (UUID)' })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'get_artist_by_id',
    description: 'Obter detalhes de um artista específico pelo ID, incluindo eventos nos quais participa.',
  })
  async findOne(@Param('id') id: string): Promise<ArtistDetailResponseDto> {
    const artist = await this.getArtistByIdUseCase.execute(id, true);
    return ArtistDetailResponseDto.fromEntity(artist);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @UseFilters(InsufficientPermissionsFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo artista', description: 'Apenas organizadores e administradores podem criar artistas.' })
  @ApiResponse({ status: 201, description: 'Artista criado com sucesso', type: ArtistResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  @ApiBody({ type: CreateArtistDto })
  async create(@Body() createArtistDto: CreateArtistDto, @Request() req: any): Promise<ArtistResponseDto> {
    const artist = await this.createArtistUseCase.execute(createArtistDto, req.user.id);

    // Gerar embeddings em background (não bloquear criação do artista)
    this.logger.info('Iniciando geração de embedding após criação', {
      artistId: artist.id,
      artisticName: artist.artisticName,
    });

    this.generateArtistEmbedding(artist.id)
      .then(() => {
        this.logger.info('Embedding gerado com sucesso após criação', {
          artistId: artist.id,
        });
      })
      .catch(error => {
        this.logger.error('Erro ao gerar embedding do artista após criação', {
          artistId: artist.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      });

    return ArtistResponseDto.fromEntity(artist);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseFilters(InsufficientPermissionsFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar artista', description: 'Apenas organizadores e administradores podem atualizar artistas.' })
  @ApiResponse({ status: 200, description: 'Artista atualizado com sucesso', type: ArtistResponseDto })
  @ApiResponse({ status: 404, description: 'Artista não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  @ApiParam({ name: 'id', description: 'ID do artista (UUID)' })
  @ApiBody({ type: UpdateArtistDto })
  async update(@Param('id') id: string, @Body() updateArtistDto: UpdateArtistDto, @Request() req: any): Promise<ArtistResponseDto> {
    const artist = await this.updateArtistUseCase.execute(id, updateArtistDto, req.user.id);

    // Gerar embeddings em background (não bloquear atualização do artista)
    this.logger.info('Iniciando geração de embedding após atualização', {
      artistId: artist.id,
      artisticName: artist.artisticName,
    });

    this.generateArtistEmbedding(artist.id)
      .then(() => {
        this.logger.info('Embedding gerado com sucesso após atualização', {
          artistId: artist.id,
        });
      })
      .catch(error => {
        this.logger.error('Erro ao gerar embedding do artista após atualização', {
          artistId: artist.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      });

    return ArtistResponseDto.fromEntity(artist);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseFilters(InsufficientPermissionsFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar artista', description: 'Apenas organizadores e administradores podem deletar artistas. O relacionamento com eventos será removido automaticamente (cascata).' })
  @ApiResponse({ status: 200, description: 'Artista deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Artista não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  @ApiParam({ name: 'id', description: 'ID do artista (UUID)' })
  async delete(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    await this.deleteArtistUseCase.execute(id, req.user.id);
    return { message: 'Artista deletado com sucesso' };
  }

  /**
   * Gera embedding e metadados para o artista
   * Executado de forma assíncrona após criação/atualização
   */
  private async generateArtistEmbedding(artistId: string): Promise<void> {
    this.logger.info('Iniciando geração de embedding', { artistId });
    
    try {
      // Buscar artista com eventos vinculados
      const artist = await this.artistRepository.findByIdWithEvents(artistId);
      if (!artist) {
        this.logger.warn('Artista não encontrado para gerar embedding', { artistId });
        return;
      }

      this.logger.info('Artista encontrado, buscando eventos', {
        artistId,
        artisticName: artist.artisticName,
      });

      // Eventos já vêm no artista quando usado findByIdWithEvents
      const events = artist.events || [];
      this.logger.info('Eventos encontrados', {
        artistId,
        eventsCount: events.length,
      });

      // Construir metadados
      const metadata = this.artistContentService.buildArtistMetadata(artist, events);
      this.logger.info('Metadados construídos', { artistId });

      // Gerar texto consolidado
      const textContent = this.artistContentService.buildTextContent(artist, events);
      this.logger.info('Texto consolidado gerado', {
        artistId,
        textLength: textContent.length,
      });

      // Gerar embedding
      this.logger.info('Gerando embedding via OpenAI', { artistId });
      const embedding = await this.embeddingService.generateEmbedding(textContent);
      const model = this.embeddingService.getModel();

      this.logger.info('Embedding gerado, atualizando artista', {
        artistId,
        embeddingDimension: embedding.length,
        model,
      });

      // Atualizar artista com metadata e embedding
      await this.artistRepository.updateEmbedding(artistId, metadata, embedding, model);

      this.logger.info('Embedding salvo com sucesso', {
        artistId,
        embeddingDimension: embedding.length,
        model,
      });
    } catch (error) {
      this.logger.error('Erro ao gerar embedding do artista', {
        artistId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Não propagar erro para não quebrar criação/atualização do artista
    }
  }
}

