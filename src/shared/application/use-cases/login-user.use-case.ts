import { Injectable, Inject } from '@nestjs/common';
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
      // Buscar usuário por email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        this.logger.warn('Tentativa de login com email não encontrado', {
          email: email,
        });
        throw new Error('Credenciais inválidas');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn('Tentativa de login com senha inválida', {
          email: email,
          userId: user.id,
        });
        throw new Error('Credenciais inválidas');
      }

      const duration = Date.now() - startTime;
      this.logger.info('Login realizado com sucesso', {
        userId: user.id,
        email: user.email,
        duration,
      });

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao fazer login', {
        email: email,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}
