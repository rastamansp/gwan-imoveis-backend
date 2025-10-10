import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('events/:id/analytics')
  @ApiOperation({ summary: 'Obter analytics de um evento' })
  @ApiResponse({ status: 200, description: 'Analytics obtidas com sucesso' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  async getEventAnalytics(@Param('id') id: string) {
    return this.adminService.getEventAnalytics(id);
  }

  @Get('users/:id/analytics')
  @ApiOperation({ summary: 'Obter analytics de um usuário' })
  @ApiResponse({ status: 200, description: 'Analytics obtidas com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async getUserAnalytics(@Param('id') id: string) {
    return this.adminService.getUserAnalytics(id);
  }
}
