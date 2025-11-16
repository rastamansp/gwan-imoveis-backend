import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseFilters, Inject, HttpCode } from '@nestjs/common';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiOkResponse, ApiExtraModels } from '@nestjs/swagger';
import { PromoteUserToCorretorUseCase } from '../shared/application/use-cases/promote-user-to-corretor.use-case';
import { PromoteUserDto } from '../shared/presentation/dtos/promote-user.dto';
import { UpdateUserDto } from '../shared/presentation/dtos/update-user.dto';
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
    private readonly promoteUserToCorretorUseCase: PromoteUserToCorretorUseCase,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar todos os usuários',
    description: 'Retorna uma lista completa de todos os usuários cadastrados no sistema. Requer autenticação JWT.'
  })
  @ApiOkResponse({ 
    description: 'Lista de usuários obtida com sucesso',
    type: [UserResponseDto],
    schema: {
      example: [
        {
          id: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          role: 'USER',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiExtraModels(UserResponseDto)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => UserResponseDto.fromEntity(user));
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obter usuário por ID',
    description: 'Retorna os dados completos de um usuário específico identificado pelo UUID. Requer autenticação JWT.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID do usuário',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String 
  })
  @ApiOkResponse({ 
    description: 'Usuário obtido com sucesso',
    type: UserResponseDto,
    schema: {
      example: {
        id: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        role: 'USER',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiExtraModels(UserResponseDto)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return UserResponseDto.fromEntity(user);
  }

  @Put(':id')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Atualizar usuário',
    description: 'Atualiza os dados de um usuário existente. Apenas os campos enviados serão atualizados. Requer autenticação JWT.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID do usuário a ser atualizado',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String 
  })
  @ApiBody({ 
    type: UpdateUserDto,
    description: 'Dados do usuário a serem atualizados',
    examples: {
      atualizarNome: {
        summary: 'Atualizar apenas o nome',
        value: {
          name: 'João Silva Santos'
        }
      },
      atualizarTelefone: {
        summary: 'Atualizar telefone',
        value: {
          phone: '11987654321'
        }
      },
      atualizarRole: {
        summary: 'Atualizar role (apenas ADMIN)',
        value: {
          role: 'CORRETOR'
        }
      },
      atualizacaoCompleta: {
        summary: 'Atualização completa',
        value: {
          name: 'João Silva Santos',
          email: 'joao.santos@email.com',
          phone: '11987654321',
          role: 'CORRETOR'
        }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos - Validação falhou' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiExtraModels(UpdateUserDto, UserResponseDto)
  async update(@Param('id') id: string, @Body() userData: UpdateUserDto): Promise<UserResponseDto> {
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
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Deletar usuário',
    description: 'Remove um usuário do sistema permanentemente. Requer autenticação JWT. Apenas ADMIN pode deletar usuários.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID do usuário a ser deletado',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String 
  })
  @ApiOkResponse({ 
    description: 'Usuário deletado com sucesso',
    schema: {
      example: {
        message: 'User deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas ADMIN pode deletar usuários' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new Error('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  @Put(':id/promote')
  @HttpCode(200)
  @UseFilters(InsufficientPermissionsFilter)
  @ApiOperation({ 
    summary: 'Promover usuário',
    description: 'Promove um usuário para um role superior (ex: USER → CORRETOR). Apenas ADMIN pode promover usuários. O usuário que está promovendo deve ter permissões adequadas.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID do usuário que será promovido',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String 
  })
  @ApiBody({ 
    type: PromoteUserDto,
    description: 'Dados da promoção',
    examples: {
      promoverParaCorretor: {
        summary: 'Promover para Corretor (padrão)',
        value: {
          targetRole: 'CORRETOR'
        }
      },
      promoverParaAdmin: {
        summary: 'Promover para Administrador',
        value: {
          targetRole: 'ADMIN'
        }
      },
      semRole: {
        summary: 'Usar role padrão (CORRETOR)',
        value: {}
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Usuário promovido com sucesso',
    type: UserResponseDto,
    schema: {
      example: {
        id: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        role: 'CORRETOR',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-29T14:45:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente - Apenas ADMIN pode promover usuários' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos - Role inválido ou usuário já possui esse role' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiExtraModels(PromoteUserDto, UserResponseDto)
  async promoteUser(
    @Param('id') targetUserId: string,
    @Body() promoteUserDto: PromoteUserDto,
    @Request() req: any,
  ) {
    const promoterUserId = req.user.id;
    const targetRole = promoteUserDto.targetRole || UserRole.CORRETOR;
    
    return this.promoteUserToCorretorUseCase.execute(targetUserId, promoterUserId, targetRole);
  }
}
