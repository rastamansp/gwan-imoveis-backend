import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';

@Injectable()
export class PromoteUserToCorretorUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(targetUserId: string, promoterUserId: string, targetRole: UserRole = UserRole.CORRETOR): Promise<User> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando promoção de usuário', {
      targetUserId,
      promoterUserId,
      targetRole,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o promotor existe e é ADMIN
      const promoter = await this.userRepository.findById(promoterUserId);
      if (!promoter) {
        throw new UserNotFoundException(promoterUserId);
      }

      if (!promoter.isAdmin()) {
        throw new InsufficientPermissionsException('Apenas administradores podem promover usuários');
      }

      // Verificar se o usuário alvo existe
      const targetUser = await this.userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new UserNotFoundException(targetUserId);
      }

      // Verificar se o usuário alvo já não tem o role desejado ou superior
      if (targetUser.role === targetRole || targetUser.role === UserRole.ADMIN) {
        this.logger.warn('Usuário já possui role adequado', {
          targetUserId,
          currentRole: targetUser.role,
          targetRole,
        });
        return targetUser;
      }

      // Promover usuário
      const updatedUser = targetUser.changeRole(targetRole);
      const savedUser = await this.userRepository.update(targetUserId, updatedUser);

      const duration = Date.now() - startTime;
      this.logger.info('Usuário promovido com sucesso', {
        targetUserId,
        promoterUserId,
        oldRole: targetUser.role,
        newRole: targetRole,
        duration,
      });

      return savedUser!;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao promover usuário', {
        targetUserId,
        promoterUserId,
        targetRole,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}
