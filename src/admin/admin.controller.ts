import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
import { AuditLogService } from '../shared/application/services/audit-log.service';
import { AuditAction } from '../shared/domain/entities/audit-log.entity';
import { ApiQuery } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly createCorretorUseCase: CreateCorretorUseCase,
    private readonly listCorretoresUseCase: ListCorretoresUseCase,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Trilha de auditoria (F19). **Só ADMIN** — a trilha mostra quem fez o quê no
   * ambiente inteiro, inclusive em imóveis de outros corretores.
   */
  @Get('audit')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Consultar a trilha de auditoria',
    description:
      'Registro append-only de ações sensíveis: criação, edição e remoção de imóvel, remoção de ' +
      'imagem e de cena de tour, promoção de usuário, login (sucesso e falha) e atribuição ou ' +
      'fechamento de conversa. Guarda QUE a ação aconteceu, nunca o conteúdo envolvido.',
  })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'entityType', required: false, example: 'property' })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'from', required: false, description: 'ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO 8601' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'Página da trilha' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN' })
  async audit(
    @Query('actorId') actorId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: AuditAction,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLog.query({
      actorId,
      entityType,
      entityId,
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

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
