import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
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
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar novo imóvel',
    description:
      'Cria um novo imóvel na plataforma. Apenas usuários com role CORRETOR ou ADMIN podem criar imóveis. O imóvel será associado ao corretor autenticado.',
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
          piscina: true,
          hidromassagem: false,
          frenteMar: true,
          jardim: true,
          areaGourmet: true,
          mobiliado: false,
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
    const corretorId = req.user?.id || req.user?.sub;
    if (!corretorId) {
      throw new Error('Usuário não autenticado corretamente');
    }
    const property = await this.createPropertyUseCase.execute(createPropertyDto, corretorId);
    return PropertyResponseDto.fromEntity(property);
  }

  @Get()
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'list_properties',
    description: 'Lista imóveis cadastrados com filtros opcionais (cidade, tipo, faixa de preço, corretor)',
  })
  @ApiOperation({
    summary: 'Listar imóveis',
    description:
      'Retorna uma lista de imóveis cadastrados. Suporta filtros opcionais por cidade, tipo, faixa de preço e corretor. Endpoint público, não requer autenticação.',
  })
  @ApiQuery({ name: 'city', required: false, description: 'Filtrar por cidade', example: 'São Sebastião' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo', enum: ['CASA', 'APARTAMENTO', 'TERRENO', 'SALA_COMERCIAL'] })
  @ApiQuery({ name: 'purpose', required: false, description: 'Filtrar por finalidade', enum: ['RENT', 'SALE', 'INVESTMENT'], example: 'RENT' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Preço mínimo', example: 100000 })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Preço máximo', example: 1000000 })
  @ApiQuery({ name: 'corretorId', required: false, description: 'Filtrar por corretor', example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5' })
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
    @Query('corretorId') corretorId?: string,
  ): Promise<PropertyResponseDto[]> {
    const filters: any = {};
    if (city) filters.city = city;
    if (type) filters.type = type;
    if (purpose) filters.purpose = purpose;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (corretorId) filters.corretorId = corretorId;

    const properties = await this.listPropertiesUseCase.execute(filters);
    return properties.map((property) => PropertyResponseDto.fromEntity(property));
  }

  @Get('my-properties')
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar meus imóveis',
    description:
      'Retorna uma lista de imóveis cadastrados pelo corretor autenticado. Apenas usuários com role CORRETOR ou ADMIN podem acessar. Requer autenticação JWT.',
  })
  @ApiOkResponse({
    description: 'Lista de imóveis do corretor obtida com sucesso',
    type: [PropertyResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem acessar' })
  @ApiExtraModels(PropertyResponseDto)
  async findMyProperties(@Request() req: any): Promise<PropertyResponseDto[]> {
    const corretorId = req.user?.id || req.user?.sub;
    if (!corretorId) {
      throw new Error('Usuário não autenticado corretamente');
    }
    const properties = await this.listMyPropertiesUseCase.execute(corretorId);
    return properties.map((property) => PropertyResponseDto.fromEntity(property));
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
    return PropertyResponseDto.fromEntity(property);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar imóvel',
    description:
      'Atualiza os dados de um imóvel existente. Apenas os campos enviados serão atualizados. Apenas o corretor dono do imóvel ou ADMIN podem atualizar. Requer autenticação JWT e role CORRETOR ou ADMIN.',
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
          piscina: true,
          areaGourmet: true,
        },
      },
      atualizacaoCompleta: {
        summary: 'Atualização completa',
        value: {
          title: 'Casa de Praia Luxuosa Renovada',
          description: 'Casa completamente reformada com 4 quartos.',
          price: 950000.00,
          bedrooms: 4,
          piscina: true,
          areaGourmet: true,
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
    const corretorId = req.user?.id || req.user?.sub;
    if (!corretorId) {
      throw new Error('Usuário não autenticado corretamente');
    }
    const property = await this.updatePropertyUseCase.execute(id, updatePropertyDto, corretorId);
    return PropertyResponseDto.fromEntity(property);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deletar imóvel',
    description:
      'Remove um imóvel do sistema permanentemente. Apenas o corretor dono do imóvel ou ADMIN podem deletar. Requer autenticação JWT e role CORRETOR ou ADMIN.',
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
    const corretorId = req.user?.id || req.user?.sub;
    if (!corretorId) {
      throw new Error('Usuário não autenticado corretamente');
    }
    await this.deletePropertyUseCase.execute(id, corretorId);
    return { message: 'Imóvel deletado com sucesso' };
  }
}

