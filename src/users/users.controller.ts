import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseFilters, Inject } from '@nestjs/common';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PromoteUserToOrganizerUseCase } from '../shared/application/use-cases/promote-user-to-organizer.use-case';
import { PromoteUserDto } from '../shared/presentation/dtos/promote-user.dto';
import { InsufficientPermissionsFilter } from '../shared/presentation/filters/insufficient-permissions.filter';
import { UserRole } from '../shared/domain/value-objects/user-role.enum';
import { UserResponseDto } from '../shared/presentation/dtos/user-response.dto';

@ApiTags('Usuários')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly promoteUserToOrganizerUseCase: PromoteUserToOrganizerUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({ status: 200, description: 'Lista de usuários obtida com sucesso' })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => UserResponseDto.fromEntity(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário obtido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return UserResponseDto.fromEntity(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async update(@Param('id') id: string, @Body() userData: any): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Atualizar propriedades do usuário
    Object.assign(user, userData);
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.update(id, user);
    return UserResponseDto.fromEntity(updatedUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new Error('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  @Put(':id/promote')
  @UseFilters(InsufficientPermissionsFilter)
  @ApiOperation({ summary: 'Promover usuário para organizador' })
  @ApiResponse({ status: 200, description: 'Usuário promovido com sucesso' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async promoteUser(
    @Param('id') targetUserId: string,
    @Body() promoteUserDto: PromoteUserDto,
    @Request() req: any,
  ) {
    const promoterUserId = req.user.id;
    const targetRole = promoteUserDto.targetRole || UserRole.ORGANIZER;
    
    return this.promoteUserToOrganizerUseCase.execute(targetUserId, promoterUserId, targetRole);
  }
}
