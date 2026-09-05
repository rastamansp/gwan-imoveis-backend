import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { AuditAction } from '../../domain/entities/audit-log.entity';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { LoginDto } from '../../../auth/dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly auditLog: AuditLogService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(email: string, password: string): Promise<User> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando login de usuário', {
      email: email,
      timestamp: new Date().toISOString(),
    });

    try {
      // `UnauthorizedException` (401), não `Error` cru: o Error virava **500** e o
      // endpoint público devolvia "Internal server error" para uma simples senha
      // errada — vazando falha interna onde a resposta certa é "credencial inválida".
      // A mensagem é a mesma nos dois ramos de propósito: dizer se o email existe
      // entrega a um atacante metade do trabalho.
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        this.logger.warn('Tentativa de login com email não encontrado', {
          email: email,
        });
        // `actorId` nulo: nao ha ator identificado numa tentativa que falhou.
        // O `motivo` fica na trilha mas NAO na resposta HTTP — dizer se o email
        // existe entrega a um atacante metade do trabalho.
        this.auditLog.record({
          action: AuditAction.LOGIN_FAILED,
          entityType: 'user',
          metadata: { email, motivo: 'email-inexistente' },
        });
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn('Tentativa de login com senha inválida', {
          email: email,
          userId: user.id,
        });
        this.auditLog.record({
          action: AuditAction.LOGIN_FAILED,
          entityType: 'user',
          entityId: user.id,
          metadata: { email, motivo: 'senha-invalida' },
        });
        throw new UnauthorizedException('Credenciais inválidas');
      }

      this.auditLog.record({
        action: AuditAction.LOGIN_SUCCEEDED,
        entityType: 'user',
        entityId: user.id,
        actorId: user.id,
        actorRole: user.role,
        metadata: { email },
      });

      const duration = Date.now() - startTime;
      this.logger.info('Login realizado com sucesso', {
        userId: user.id,
        email: user.email,
        duration,
      });

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Credencial inválida é operação normal de um endpoint público, e já foi
      // registrada como `warn` acima. Elevá-la a `error` encheria o log de alerta
      // com gente digitando a senha errada, e é assim que se perde a falha real.
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Erro ao fazer login', {
        email: email,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}
