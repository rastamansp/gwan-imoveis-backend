import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiOkResponse,
  ApiExtraModels,
  ApiExtension,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CorretorOrAdminGuard } from '../auth/guards/corretor-or-admin.guard';
import { CreatePropertyDto } from './presentation/dtos/create-property.dto';
import { UpdatePropertyDto } from './presentation/dtos/update-property.dto';
import { PropertyResponseDto } from './presentation/dtos/property-response.dto';
import { CreatePropertyUseCase } from '../shared/application/use-cases/create-property.use-case';
import { UpdatePropertyUseCase } from '../shared/application/use-cases/update-property.use-case';
import { DeletePropertyUseCase } from '../shared/application/use-cases/delete-property.use-case';
import { GetPropertyByIdUseCase } from '../shared/application/use-cases/get-property-by-id.use-case';
import { ListPropertiesUseCase } from '../shared/application/use-cases/list-properties.use-case';
import { ListMyPropertiesUseCase } from '../shared/application/use-cases/list-my-properties.use-case';
import { SearchPropertiesSemanticUseCase } from '../shared/application/use-cases/search-properties-semantic.use-case';
import { PropertySearchResultDto } from './presentation/dtos/property-search-result.dto';
import { RealtorContactResolverService } from './services/realtor-contact-resolver.service';
import { PropertyPdfCacheService } from './services/property-pdf-cache.service';
import { UserRole } from '../shared/domain/value-objects/user-role.enum';

@ApiTags('Imóveis')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly updatePropertyUseCase: UpdatePropertyUseCase,
    private readonly deletePropertyUseCase: DeletePropertyUseCase,
    private readonly getPropertyByIdUseCase: GetPropertyByIdUseCase,
    private readonly listPropertiesUseCase: ListPropertiesUseCase,
    private readonly listMyPropertiesUseCase: ListMyPropertiesUseCase,
    private readonly searchPropertiesSemanticUseCase: SearchPropertiesSemanticUseCase,
    private readonly realtorContactResolver: RealtorContactResolverService,
    private readonly propertyPdfCache: PropertyPdfCacheService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar novo imóvel',
    description:
      'Cria um novo imóvel na plataforma. Apenas usuários com role CORRETOR ou ADMIN podem criar imóveis. O imóvel será associado ao realtor autenticado.',
  })
  @ApiBody({
    type: CreatePropertyDto,
    description: 'Dados do imóvel a ser criado',
    examples: {
      casaPraia: {
        summary: 'Casa de praia completa',
        value: {
          title: 'Casa de Praia Luxuosa com Vista para o Mar',
          description: 'Casa espaçosa com 3 quartos, 2 banheiros, área gourmet e piscina. Localizada em frente ao mar.',
          type: 'CASA',
          price: 850000.00,
          neighborhood: 'Maresias',
          city: 'São Sebastião',
          bedrooms: 3,
          bathrooms: 2,
          area: 150.50,
          garageSpaces: 2,
          hasPool: true,
          hasJacuzzi: false,
          oceanFront: true,
          hasGarden: true,
          hasGourmetArea: true,
          furnished: false,
        },
      },
      apartamento: {
        summary: 'Apartamento simples',
        value: {
          title: 'Apartamento 2 quartos no centro',
          description: 'Apartamento bem localizado, próximo ao comércio e praia.',
          type: 'APARTAMENTO',
          price: 350000.00,
          neighborhood: 'Centro',
          city: 'São Sebastião',
          bedrooms: 2,
          bathrooms: 1,
          area: 65.00,
          garageSpaces: 1,
          piscina: false,
          hidromassagem: false,
          frenteMar: false,
          jardim: false,
          areaGourmet: false,
          mobiliado: true,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Imóvel criado com sucesso',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem criar imóveis' })
  @ApiResponse({ status: 400, description: 'Dados inválidos - Validação falhou' })
  @ApiExtraModels(CreatePropertyDto, PropertyResponseDto)
  async create(@Body() createPropertyDto: CreatePropertyDto, @Request() req: any): Promise<PropertyResponseDto> {
    // req.user é o objeto User completo retornado pelo JwtStrategy.validate()
    const realtorId = req.user?.id || req.user?.sub;
    if (!realtorId) {
      throw new Error('User not authenticated correctly');
    }
    const property = await this.createPropertyUseCase.execute(createPropertyDto, realtorId);
    return PropertyResponseDto.fromEntity(property);
  }

  @Get()
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'list_properties',
    description: 'Lista imóveis cadastrados com filtros opcionais (cidade, tipo, faixa de preço, realtor)',
  })
  @ApiOperation({
    summary: 'Listar imóveis',
    description:
      'Retorna uma lista de imóveis cadastrados. Suporta filtros opcionais por cidade, tipo, faixa de preço e realtor. Endpoint público, não requer autenticação.',
  })
  @ApiQuery({ name: 'city', required: false, description: 'Filtrar por cidade', example: 'São Sebastião' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo', enum: ['CASA', 'APARTAMENTO', 'TERRENO', 'SALA_COMERCIAL'] })
  @ApiQuery({ name: 'purpose', required: false, description: 'Filtrar por finalidade', enum: ['RENT', 'SALE', 'INVESTMENT'], example: 'RENT' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Preço mínimo', example: 100000 })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Preço máximo', example: 1000000 })
  @ApiQuery({ name: 'realtorId', required: false, description: 'Filter by realtor', example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5' })
  @ApiQuery({ name: 'hasPool', required: false, description: 'Filtrar imóveis com piscina', example: true })
  @ApiQuery({ name: 'hasJacuzzi', required: false, description: 'Filtrar imóveis com hidromassagem', example: true })
  @ApiQuery({ name: 'oceanFront', required: false, description: 'Filtrar imóveis de frente para o mar', example: true })
  @ApiQuery({ name: 'hasGarden', required: false, description: 'Filtrar imóveis com jardim', example: true })
  @ApiQuery({ name: 'hasGourmetArea', required: false, description: 'Filtrar imóveis com área gourmet', example: true })
  @ApiQuery({ name: 'furnished', required: false, description: 'Filtrar imóveis mobiliados', example: true })
  @ApiOkResponse({
    description: 'Lista de imóveis obtida com sucesso',
    type: [PropertyResponseDto],
  })
  @ApiExtraModels(PropertyResponseDto)
  async findAll(
    @Query('city') city?: string,
    @Query('type') type?: string,
    @Query('purpose') purpose?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('realtorId') realtorId?: string,
    @Query('hasPool') hasPool?: string,
    @Query('hasJacuzzi') hasJacuzzi?: string,
    @Query('oceanFront') oceanFront?: string,
    @Query('hasGarden') hasGarden?: string,
    @Query('hasGourmetArea') hasGourmetArea?: string,
    @Query('furnished') furnished?: string,
  ): Promise<PropertyResponseDto[]> {
    const filters: any = {};
    if (city) filters.city = city;
    if (type) filters.type = type;
    if (purpose) filters.purpose = purpose;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (realtorId) filters.realtorId = realtorId;
    if (hasPool === 'true') filters.hasPool = true;
    if (hasJacuzzi === 'true') filters.hasJacuzzi = true;
    if (oceanFront === 'true') filters.oceanFront = true;
    if (hasGarden === 'true') filters.hasGarden = true;
    if (hasGourmetArea === 'true') filters.hasGourmetArea = true;
    if (furnished === 'true') filters.furnished = true;

    const properties = await this.listPropertiesUseCase.execute(filters);
    return properties.map((property) => PropertyResponseDto.fromEntity(property));
  }

  @Get('my-properties')
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar meus imóveis',
    description:
      'Retorna uma lista de imóveis cadastrados pelo realtor autenticado. Apenas usuários com role CORRETOR ou ADMIN podem acessar. Requer autenticação JWT.',
  })
  @ApiOkResponse({
    description: 'Lista de imóveis do realtor obtida com sucesso',
    type: [PropertyResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem acessar' })
  @ApiExtraModels(PropertyResponseDto)
  async findMyProperties(@Request() req: any): Promise<PropertyResponseDto[]> {
    const realtorId = req.user?.id || req.user?.sub;
    if (!realtorId) {
      throw new HttpException('User not authenticated correctly', HttpStatus.UNAUTHORIZED);
    }
    const properties = await this.listMyPropertiesUseCase.execute(realtorId);
    return properties.map((property) => PropertyResponseDto.fromEntity(property));
  }

  @Get('search')
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'search_properties_semantic',
    description: 'Busca imóveis por similaridade semântica (RAG) a partir de uma query em linguagem natural. Aceita os mesmos filtros estruturados do listar regular como pré-filtro.',
  })
  @ApiOperation({
    summary: 'Busca semântica de imóveis (RAG)',
    description:
      'Recebe uma query em linguagem natural, gera embedding via provider configurado (Voyage por default, OpenAI alternativo) e retorna imóveis ordenados por similaridade cosseno. Endpoint público. Imóveis sem embedding gerado pelo provider ativo são excluídos do resultado.',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Texto da busca em linguagem natural', example: 'apartamento perto do mar com piscina e área gourmet' })
  @ApiQuery({ name: 'city', required: false, description: 'Pré-filtro: cidade', example: 'São Sebastião' })
  @ApiQuery({ name: 'type', required: false, description: 'Pré-filtro: tipo', enum: ['CASA', 'APARTAMENTO', 'TERRENO', 'SALA_COMERCIAL'] })
  @ApiQuery({ name: 'purpose', required: false, description: 'Pré-filtro: finalidade', enum: ['RENT', 'SALE', 'INVESTMENT'] })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Pré-filtro: preço mínimo', example: 100000 })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Pré-filtro: preço máximo', example: 1000000 })
  @ApiQuery({ name: 'realtorId', required: false, description: 'Pré-filtro: corretor' })
  @ApiQuery({ name: 'hasPool', required: false, description: 'Pré-filtro: imóveis com piscina', example: true })
  @ApiQuery({ name: 'hasJacuzzi', required: false, description: 'Pré-filtro: imóveis com hidromassagem', example: true })
  @ApiQuery({ name: 'oceanFront', required: false, description: 'Pré-filtro: imóveis de frente para o mar', example: true })
  @ApiQuery({ name: 'hasGarden', required: false, description: 'Pré-filtro: imóveis com jardim', example: true })
  @ApiQuery({ name: 'hasGourmetArea', required: false, description: 'Pré-filtro: imóveis com área gourmet', example: true })
  @ApiQuery({ name: 'furnished', required: false, description: 'Pré-filtro: imóveis mobiliados', example: true })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (default 20, max 50)', example: 20 })
  @ApiQuery({ name: 'minScore', required: false, description: 'Score mínimo de similaridade cosseno (0..1). Default 0.5 — passe 0 para receber tudo.', example: 0.5 })
  @ApiOkResponse({ description: 'Resultados ordenados por similaridade decrescente', type: [PropertySearchResultDto] })
  @ApiResponse({ status: 400, description: 'Parâmetro q ausente' })
  @ApiResponse({ status: 503, description: 'Provider de embedding sem API key configurada' })
  @ApiExtraModels(PropertySearchResultDto)
  async semanticSearch(
    @Query('q') q?: string,
    @Query('city') city?: string,
    @Query('type') type?: string,
    @Query('purpose') purpose?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('realtorId') realtorId?: string,
    @Query('hasPool') hasPool?: string,
    @Query('hasJacuzzi') hasJacuzzi?: string,
    @Query('oceanFront') oceanFront?: string,
    @Query('hasGarden') hasGarden?: string,
    @Query('hasGourmetArea') hasGourmetArea?: string,
    @Query('furnished') furnished?: string,
    @Query('limit') limit?: string,
    @Query('minScore') minScore?: string,
  ): Promise<PropertySearchResultDto[]> {
    if (!q || q.trim().length === 0) {
      throw new HttpException('Parâmetro "q" é obrigatório', HttpStatus.BAD_REQUEST);
    }

    const filters: any = {};
    if (city) filters.city = city;
    if (type) filters.type = type;
    if (purpose) filters.purpose = purpose;
    if (realtorId) filters.realtorId = realtorId;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (hasPool === 'true') filters.hasPool = true;
    if (hasJacuzzi === 'true') filters.hasJacuzzi = true;
    if (oceanFront === 'true') filters.oceanFront = true;
    if (hasGarden === 'true') filters.hasGarden = true;
    if (hasGourmetArea === 'true') filters.hasGourmetArea = true;
    if (furnished === 'true') filters.furnished = true;

    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 20, 50) : 20;
    // Default 0.5: corta a "cauda" de resultados pouco relevantes que apareceriam
    // em busca puramente semântica (cosine sim) — cliente pode sobrescrever para 0 se quiser tudo.
    const parsedMinScore = minScore !== undefined ? Math.max(0, Math.min(parseFloat(minScore) || 0, 1)) : 0.5;

    const hits = await this.searchPropertiesSemanticUseCase.execute({
      q: q.trim(),
      filters,
      limit: parsedLimit,
      minScore: parsedMinScore,
    });

    return hits.map((hit) => ({
      property: PropertyResponseDto.fromEntity(hit.property),
      score: Number(hit.score.toFixed(4)),
      distance: Number(hit.distance.toFixed(4)),
    }));
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Baixar anúncio do imóvel em PDF',
    description:
      'Gera e baixa um PDF com o anúncio completo do imóvel (capa, dados, descrição, contato e galeria). Apenas o corretor dono do imóvel ou ADMIN podem baixar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do imóvel',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'PDF gerado com sucesso (application/pdf)' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas o dono do imóvel ou ADMIN podem baixar' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  async downloadPdf(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id || req.user?.sub;
    const userRole: UserRole = req.user?.role;

    const property = await this.getPropertyByIdUseCase.execute(id);

    if (userRole !== UserRole.ADMIN && property.realtorId !== userId) {
      throw new ForbiddenException('Você não tem permissão para baixar o PDF deste imóvel');
    }

    const pdf = await this.propertyPdfCache.getOrGenerate(property);

    const filename = this.buildPdfFilename(property.title, property.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  }

  private buildPdfFilename(title: string, id: string): string {
    const slug = title
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 50);
    const suffix = id.slice(0, 8);
    return `${slug || 'imovel'}-${suffix}.pdf`;
  }

  @Get(':id')
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'get_property_by_id',
    description: 'Obtém detalhes completos de um imóvel específico pelo UUID',
  })
  @ApiOperation({
    summary: 'Obter imóvel por ID',
    description: 'Retorna os dados completos de um imóvel específico identificado pelo UUID. Endpoint público, não requer autenticação.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do imóvel',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiOkResponse({
    description: 'Imóvel obtido com sucesso',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiExtraModels(PropertyResponseDto)
  async findOne(@Param('id') id: string): Promise<PropertyResponseDto> {
    const property = await this.getPropertyByIdUseCase.execute(id);
    const contact = property.realtor
      ? await this.realtorContactResolver.resolveWhatsapp(property.realtor)
      : null;
    return PropertyResponseDto.fromEntity(property, {
      contactWhatsapp: contact?.whatsapp ?? null,
      contactWhatsappSource: contact?.source ?? null,
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar imóvel',
    description:
      'Atualiza os dados de um imóvel existente. Apenas os campos enviados serão atualizados. Apenas o realtor dono do imóvel ou ADMIN podem atualizar. Requer autenticação JWT e role CORRETOR ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do imóvel a ser atualizado',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiBody({
    type: UpdatePropertyDto,
    description: 'Dados do imóvel a serem atualizados',
    examples: {
      atualizarPreco: {
        summary: 'Atualizar apenas o preço',
        value: {
          price: 900000.00,
        },
      },
      atualizarComodidades: {
        summary: 'Atualizar comodidades',
        value: {
          hasPool: true,
          hasGourmetArea: true,
        },
      },
      atualizacaoCompleta: {
        summary: 'Atualização completa',
        value: {
          title: 'Casa de Praia Luxuosa Renovada',
          description: 'Casa completamente reformada com 4 quartos.',
          price: 950000.00,
          bedrooms: 4,
          hasPool: true,
          hasGourmetArea: true,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Imóvel atualizado com sucesso',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos - Validação falhou' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas o dono do imóvel ou ADMIN podem atualizar' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiExtraModels(UpdatePropertyDto, PropertyResponseDto)
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req: any,
  ): Promise<PropertyResponseDto> {
    // req.user é o objeto User completo retornado pelo JwtStrategy.validate()
    const realtorId = req.user?.id || req.user?.sub;
    if (!realtorId) {
      throw new Error('User not authenticated correctly');
    }
    const property = await this.updatePropertyUseCase.execute(id, updatePropertyDto, realtorId);
    return PropertyResponseDto.fromEntity(property);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deletar imóvel',
    description:
      'Remove um imóvel do sistema permanentemente. Apenas o realtor dono do imóvel ou ADMIN podem deletar. Requer autenticação JWT e role CORRETOR ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do imóvel a ser deletado',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiOkResponse({
    description: 'Imóvel deletado com sucesso',
    schema: {
      example: {
        message: 'Imóvel deletado com sucesso',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas o dono do imóvel ou ADMIN podem deletar' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  async delete(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    // req.user é o objeto User completo retornado pelo JwtStrategy.validate()
    const realtorId = req.user?.id || req.user?.sub;
    if (!realtorId) {
      throw new Error('User not authenticated correctly');
    }
    await this.deletePropertyUseCase.execute(id, realtorId);
    return { message: 'Imóvel deletado com sucesso' };
  }
}

