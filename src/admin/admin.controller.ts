import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateCorretorUseCase } from './use-cases/create-corretor.use-case';
import { ListCorretoresUseCase } from './use-cases/list-corretores.use-case';
import { CreateCorretorDto } from './presentation/dtos/create-corretor.dto';
import { CorretorResponseDto } from './presentation/dtos/corretor-response.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly createCorretorUseCase: CreateCorretorUseCase,
    private readonly listCorretoresUseCase: ListCorretoresUseCase,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users/:id/analytics')
  @ApiOperation({ summary: 'Obter analytics de um usuário' })
  @ApiResponse({ status: 200, description: 'Analytics obtidas com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async getUserAnalytics(@Param('id') id: string) {
    return this.adminService.getUserAnalytics(id);
  }

  // ─── Corretores ───────────────────────────────────────────────────────────

  @Get('corretores')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Listar corretores cadastrados',
    description: 'Retorna todos os usuários com role CORRETOR ou ADMIN. Apenas ADMIN pode acessar.',
  })
  @ApiOkResponse({ type: [CorretorResponseDto] })
  async listCorretores(): Promise<CorretorResponseDto[]> {
    const corretores = await this.listCorretoresUseCase.execute();
    return corretores.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      role: 'CORRETOR',
      businessName: c.businessName,
      whatsappBusiness: c.whatsappBusiness,
      createdAt: c.createdAt,
    }));
  }

  @Post('corretores')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Criar novo corretor',
    description: 'Cria um usuário com role CORRETOR e um perfil de corretor associado. Apenas ADMIN pode criar.',
  })
  @ApiBody({ type: CreateCorretorDto })
  @ApiResponse({ status: 201, type: CorretorResponseDto })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async createCorretor(@Body() dto: CreateCorretorDto): Promise<CorretorResponseDto> {
    const { user, profile } = await this.createCorretorUseCase.execute(dto);
    return CorretorResponseDto.fromEntities(user, profile);
  }
}
