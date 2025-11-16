import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { UpdateRealtorProfileDto } from './presentation/dtos/update-realtor-profile.dto';
import { RealtorProfileResponseDto } from './presentation/dtos/realtor-profile-response.dto';
import { GetMyRealtorProfileUseCase } from '../shared/application/use-cases/get-my-realtor-profile.use-case';
import { UpdateMyRealtorProfileUseCase } from '../shared/application/use-cases/update-my-realtor-profile.use-case';
import { GetPropertyByIdUseCase } from '../shared/application/use-cases/get-property-by-id.use-case';
import { Property } from '../shared/domain/entities/property.entity';

@ApiTags('Realtors')
@Controller('realtors')
export class RealtorsController {
  constructor(
    private readonly getMyProfileUseCase: GetMyRealtorProfileUseCase,
    private readonly updateMyProfileUseCase: UpdateMyRealtorProfileUseCase,
    private readonly getPropertyByIdUseCase: GetPropertyByIdUseCase,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter meu perfil de corretor',
    description:
      'Retorna o perfil profissional do corretor autenticado. Apenas usuários com role CORRETOR ou ADMIN podem acessar. Requer autenticação JWT.',
  })
  @ApiOkResponse({
    description: 'Perfil do corretor obtido com sucesso',
    type: RealtorProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem acessar' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @ApiExtraModels(RealtorProfileResponseDto)
  async getMyProfile(@Request() req: any): Promise<RealtorProfileResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new Error('Usuário não autenticado corretamente');
    }
    const profile = await this.getMyProfileUseCase.execute(userId);
    return RealtorProfileResponseDto.fromEntity(profile);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar meu perfil de corretor',
    description:
      'Atualiza o perfil profissional do corretor autenticado. Se o perfil não existir, será criado automaticamente. Apenas usuários com role CORRETOR ou ADMIN podem atualizar. Requer autenticação JWT.',
  })
  @ApiBody({
    type: UpdateRealtorProfileDto,
    description: 'Dados do perfil a serem atualizados',
    examples: {
      atualizarBasico: {
        summary: 'Atualizar informações básicas',
        value: {
          businessName: 'Imóveis Premium Litoral',
          contactName: 'João Silva',
          phone: '11999999999',
          email: 'contato@imoveispremium.com.br',
        },
      },
      atualizarRedesSociais: {
        summary: 'Atualizar redes sociais',
        value: {
          instagram: 'https://instagram.com/imoveispremium',
          facebook: 'https://facebook.com/imoveispremium',
          linkedin: 'https://linkedin.com/in/joaosilva',
          whatsappBusiness: '11999999999',
        },
      },
      atualizacaoCompleta: {
        summary: 'Atualização completa',
        value: {
          businessName: 'Imóveis Premium Litoral',
          contactName: 'João Silva',
          phone: '11999999999',
          email: 'contato@imoveispremium.com.br',
          instagram: 'https://instagram.com/imoveispremium',
          facebook: 'https://facebook.com/imoveispremium',
          linkedin: 'https://linkedin.com/in/joaosilva',
          whatsappBusiness: '11999999999',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Perfil do corretor atualizado com sucesso',
    type: RealtorProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos - Validação falhou' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem atualizar' })
  @ApiExtraModels(UpdateRealtorProfileDto, RealtorProfileResponseDto)
  async updateMyProfile(
    @Body() updateDto: UpdateRealtorProfileDto,
    @Request() req: any,
  ): Promise<RealtorProfileResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new Error('Usuário não autenticado corretamente');
    }
    const profile = await this.updateMyProfileUseCase.execute(userId, updateDto);
    return RealtorProfileResponseDto.fromEntity(profile);
  }
}

@ApiTags('Imóveis')
@Controller('properties')
export class PropertiesRealtorController {
  constructor(private readonly getPropertyByIdUseCase: GetPropertyByIdUseCase) {}

  @Get(':id/realtor')
  @ApiOperation({
    summary: 'Obter corretor do imóvel',
    description:
      'Retorna as informações do corretor responsável pelo imóvel, incluindo perfil profissional se disponível. Endpoint público, não requer autenticação.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do imóvel',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiOkResponse({
    description: 'Corretor do imóvel obtido com sucesso',
    type: RealtorProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiExtraModels(RealtorProfileResponseDto)
  async getRealtorByProperty(@Param('id') propertyId: string): Promise<RealtorProfileResponseDto | null> {
    const property = await this.getPropertyByIdUseCase.execute(propertyId);
    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    if (!property.realtor) {
      throw new NotFoundException('Realtor not found for this property');
    }

    // If realtor has profile, return the profile
    // Otherwise, return null (frontend can use basic User data)
    if ((property.realtor as any).realtorProfile) {
      return RealtorProfileResponseDto.fromEntity((property.realtor as any).realtorProfile);
    }

    return null;
  }
}

